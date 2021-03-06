import models    from '../models'
import UserProxy from './user'
import * as at from '../common/at'
import _       from 'lodash'
import Promise from 'promise'
import * as tools     from '../common/tools'
import * as ResultMsg from '../constrants/ResultMsg'

let TopicModel = models.Topic;
/**
 * 获取关键词能搜索到的主题数量
 * Callback:
 * - err, 数据库错误
 * - count, 主题数量
 * @param {String} query 搜索关键词
 */
exports.getCountByQuery = function (query) {
  return new Promise(function(resolve, reject) {
    TopicModel.count(query, function(err, count) {
      if (err) reject(err)
      else resolve(count)
    })
  })
};

/**
 * 根据关键词，获取主题列表
 * Callback:
 * - err, 数据库错误
 * - count, 主题列表
 * @param {String} query 搜索关键词
 * @param {Object} opt 搜索选项
 */
exports.getTopicsByQuery = function (query, opt) {
  query.deleted = false;

  return new Promise(function(resolve, reject) {
    TopicModel.find(query, {}, opt, function (err, topics) {
      if (err) return reject(ResultMsg.DB_ERROR)
      else resolve(topics)
    })
  })
};

// for sitemap
exports.getLimit5w = function () {
  return new Promise(function(resolve, reject) {
    TopicModel.find({deleted: false}, '_id', {limit: 50000, sort: '-create_at'}, function(err, docs) {
      if (err) reject(err)
      else resolve(docs)
    })
  })
};

/**
 * 更新主题的最后回复信息
 * @param {String} topicId 主题ID
 * @param {String} replyId 回复ID
 */
exports.updateLastReply = function (topicId, replyId) {
  return new Promise(function(resolve, reject) {

    if (!topicId || !replyId) {
      return reject(ResultMsg.PARAMS_ERROR)
    }
    TopicModel.findOne({_id: topicId}, function (err, topic) {
      if (err) {
        return reject(ResultMsg.DB_ERROR)
      }

      if (!topic) {
        return reject(ResultMsg.DATA_NOT_FOUND)
      }

      topic.last_reply    = replyId;
      topic.last_reply_at = new Date();
      topic.reply_count  += 1;
      topic.save(function(err, doc) {
        if (err) reject(ResultMsg.DB_ERROR)
        else resolve(doc)
      })
    })
  })
};

/**
 * 根据主题ID，查找一条主题(附带作者信息)
 * @param {String} id 主题ID
 */
exports.getTopicById = function (id) {
  return new Promise(function(resolve, reject) {
    TopicModel.findOne({_id: id}, function(err, doc) {
      if (err) reject(ResultMsg.DB_ERROR)
      else {
        UserProxy.getUserById(doc.author_id)
          .then(author => {
            doc = doc.toObject()
            doc.linkedContent = at.linkUsers(doc.content)
            doc.author = author
            doc.create_at = tools.formatDate(doc.create_at)
            doc.update_at = tools.formatDate(doc.update_at)
            resolve(doc)
          })
          .catch(err => reject(ResultMsg.DB_ERROR))
      }
    })
  })
};

/**
 * 将当前主题的回复计数减1，并且更新最后回复的用户，删除回复时用到
 * @param {String} id 主题ID
 */
exports.reduceTopicCount = function (topicId, lastReplyId) {
  return new Promise(function(resolve, reject) {
    if (!topicId || !lastReplyId) {
      return reject(ResultMsg.PARAMS_ERROR)
    }
    
    TopicModel.findOne({_id: topicId}, function (err, doc) {
      if (err) return reject(ResultMsg.DB_ERROR)
      if (!doc) return reject(ResultMsg.DATA_NOT_FOUND)
      doc.reply_count -= 1
      doc.last_reply = lastReplyId
      doc.save(function(err) {
        if (err) reject(ResultMsg.DB_ERROR)
        else resolve()
      })
    })
  })
};

exports.newAndSave = function (topic) {
  return new Promise(function(resolve, reject) {
    var newTopic       = new TopicModel();
    newTopic.title     = topic.title;
    newTopic.content   = topic.content;
    newTopic.menu      = topic.menu;
    newTopic.submenu   = topic.submenu;
    newTopic.author_id = topic.authorId;
    newTopic.status    = topic.status;

    newTopic.save(function(err, doc) {
      if (err) reject(ResultMsg.DB_ERROR)
      else resolve(doc)
    })
  })
};

exports.update = function(topic) {
  return new Promise(function(resolve, reject) {
    if (!topic) return reject(ResultMsg.PARAMS_ERROR)
    topic.save(function(err, doc) {
      if (err) reject(ResultMsg.DB_ERROR)
      else resolve(resolve(doc))
    })
  })
}
