var validator  = require('validator');
var _          = require('lodash');
var at         = require('../common/at');
var message    = require('../common/message');
var EventProxy = require('eventproxy');
var User       = require('../proxy').User;
var Topic      = require('../proxy').Topic;
var Reply      = require('../proxy').Reply;
var config     = require('../config');

/**
 * 获取回复列表
 */
exports.Replies = function (req, res, next) {
  var topic_id = req.params.topic_id;

  Reply.getRepliesByTopicId(topic_id, function(err, replies) {
    if (err) {
      return res.json({success: false, message: '出错'});
    } else {
      return res.json({success: true, replies: replies});
    }
  });
}

/**
 * 添加回复
 */
exports.add = function (req, res, next) {
  var content = req.body.content;
  var topic_id = req.params.topic_id;
  var reply_id = req.body.reply_id;

  var str = validator.trim(String(content));
  if (str === '') {
    res.json({success: false, message: '回复内容不能为空。'});
  }

  var ep = EventProxy.create();
  ep.fail(next);

  Topic.getTopic(topic_id, ep.doneLater(function (topic) {
    if (!topic) {
      ep.unbind();
      // just 404 page
      return next();
    }

    if (topic.lock) {
      res.json({success: false, message: '此主题已锁定。'});
    }
    ep.emit('topic', topic);
  }));

  ep.all('topic', function (topic) {
    User.getUserById(topic.author_id, ep.done('topic_author'));
  });

  ep.all('topic', 'topic_author', function (topic, topicAuthor) {
    Reply.newAndSave(content, topic_id, req.session.user._id, reply_id, ep.done(function (reply) {
      Topic.updateLastReply(topic_id, reply._id, ep.done(function () {
        ep.emit('reply_saved', reply);
        //发送at消息，并防止重复 at 作者
        var newContent = content.replace('@' + topicAuthor.loginname + ' ', '');
        at.sendMessageToMentionUsers(newContent, topic_id, req.session.user._id, reply._id);
      }));
    }));

    User.getUserById(req.session.user._id, ep.done(function (user) {
      user.score += 5;
      user.reply_count += 1;
      user.save();
      req.session.user = user;
      ep.emit('score_saved');
    }));
  });

  ep.all('reply_saved', 'topic', function (reply, topic) {
    if (topic.author_id.toString() !== req.session.user._id.toString()) {
      message.sendReplyMessage(topic.author_id, req.session.user._id, topic._id, reply._id);
    }
    ep.emit('message_saved');
  });

  ep.all('reply_saved', 'message_saved', 'score_saved', function (reply) {
    Reply.getReplyById(reply._id, function (err, reply) {
      if (err) {
        return res.json({success: false, message: '数据库错误'});
      }

      res.json({success: true, reply: reply});
    });

  });
};

/**
 * 删除回复信息
 */
exports.delete = function (req, res, next) {
  var reply_id = req.body.reply_id;
  Reply.getReply(reply_id, function (err, reply) {
    if (err) {
      return next(err);
    }

    if (!reply) {
      res.json({success: false, message: 'no' + reply_id + ' exists'});
      return;
    }
    if (reply.author_id.toString() === req.session.user._id.toString() || req.session.user.is_admin) {
      reply.deleted = true;
      reply.save();

      User.getUserById(req.session.user._id, function (err, author) {
        author.score -= 5;
        author.reply_count -= 1;
        author.save();
        res.json({success: true});
      });
    } else {
      res.json({success: false, message: 'failed'});
      return;
    }

    Topic.reduceCount(reply.topic_id, _.noop);
  });
};
/*
 打开回复编辑器
 */
exports.showEdit = function (req, res, next) {
  var reply_id = req.params.reply_id;

  Reply.getReplyById(reply_id, function (err, reply) {
    if (!reply) {
      return res.render404('此回复不存在或已被删除。');
    }
    if (req.session.user._id.equals(reply.author_id) || req.session.user.is_admin) {
      res.render('reply/edit', {
        reply_id: reply._id,
        content: reply.content
      });
    } else {
      return res.renderError('对不起，你不能编辑此回复。', 403);
    }
  });
};
/*
 提交编辑回复
 */
exports.update = function (req, res, next) {
  var reply_id = req.params.reply_id;
  var content = req.body.content;

  Reply.getReplyById(reply_id, function (err, reply) {
    if (!reply) {
      return res.json({success: false, message: '此回复不存在或已被删除。'});
    }

    if (String(reply.author_id) === req.session.user._id.toString() || req.session.user.is_admin) {

      if (content.trim().length > 0) {
        reply.content = content;
        reply.save(function (err) {
          if (err) {
            return next(err);
          }
          return res.json({success: true});
        });
      } else {
        return res.json({success: false, message: '回复的字数太少。'});
      }
    } else {
      return res.json({success: false, message: '对不起，你不能编辑此回复。'});
    }
  });
};

exports.up = function (req, res, next) {
  var replyId = req.params.reply_id;
  var userId = req.session.user._id;
  Reply.getReplyById(replyId, function (err, reply) {
    if (err) {
      return next(err);
    }
    if (reply.author_id.equals(userId) && !config.debug) {
      // 不能帮自己点赞
      res.send({
        success: false,
        message: '呵呵，不能帮自己点赞。',
      });
    } else {
      var action;
      reply.ups = reply.ups || [];
      var upIndex = reply.ups.indexOf(userId);
      if (upIndex === -1) {
        reply.ups.push(userId);
        action = 'up';
      } else {
        reply.ups.splice(upIndex, 1);
        action = 'down';
      }
      reply.save(function () {
        res.send({
          success: true,
          action: action
        });
      });
    }
  });
};
