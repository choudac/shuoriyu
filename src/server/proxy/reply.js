import models  from '../models'
import * as tools from '../common/tools'
import * as at   from '../common/at'
import * as renderHelper from '../common/render_helper'
import Promise from 'promise'
import * as ResultMsg from '../constrants/ResultMsg'

let ReplyModel = models.Reply


/**
 * 获取关键词能搜索到的主题数量
 * Callback:
 * - err, 数据库错误
 * - count, 回复数量
 * @param {String} query 搜索关键词
 */
exports.getCountByQuery = function (query) {
  return new Promise(function(resolve, reject) {
    ReplyModel.count(query, function(err, count) {
      if (err) reject(err)
      else resolve(count)
    })
  })
};

/**
 * 获取一条回复信息
 * @param {String} id 回复ID
 */
exports.getReplyById = function (id) {
  return new Promise(function(resolve, reject) {
    ReplyModel.findOne({_id: id}, function(err, doc) {
      if (err) reject(ResultMsg.DB_ERROR)
      else resolve(doc)
    })
  })
};

/**
 * 根据主题ID，获取回复列表
 * Callback:
 * - err, 数据库异常
 * - replies, 回复列表
 * @param {String} id 主题ID
 */
exports.getRepliesByTopicId = function (id) {
  return new Promise(function(resolve, reject) {
    ReplyModel.find({topic_id: id, deleted: false}, '', {sort: 'create_at'}, function (err, docs) {
      if (err) return reject(ResultMsg.DB_ERROR)
      if (!docs) return reject(ResultMsg.DATA_NOT_FOUND)
      resolve(docs)
    })
  })
};

/**
 * 根据query，获取回复列表
 * Callback:
 * - err, 数据库异常
 * - replies, 回复列表
 * @param {String} id 主题ID
 */
exports.getRepliesByQuery = function (query, opt) {
  return new Promise(function(resolve, reject) {
    if (!query || !opt) return reject(ResultMsg.PARAMS_ERROR)
    ReplyModel.find(query, '', opt, function (err, docs) {
      if (err) return reject(ResultMsg.DB_ERROR)
      if (!docs) return reject(ResultMsg.DATA_NOT_FOUND)
      resolve(docs)
    })
  })
};

/**
 * 创建并保存一条回复信息
 * @param {String} content 回复内容
 * @param {String} topicId 主题ID
 * @param {String} authorId 回复作者
 * @param {String} [replyId] 回复ID，当二级回复时设定该值
 */
exports.newAndSave = function ({content, topicId, authorId, replyId}) {
  return new Promise(function(resolve, reject) {
    if (!content || !topicId || !authorId) {
      reject(ResultMsg.PARAMS_ERROR)
      return
    }

    replyId  = !replyId ? '' : replyId;

    var reply       = new ReplyModel();
    reply.content   = content;
    reply.topic_id  = topicId;
    reply.author_id = authorId;

    if (replyId) reply.reply_id = replyId;

    reply.save(function (err, doc) {
      if (err) reject(ResultMsg.DB_ERROR)
      else if (!doc) reject(ResultMsg.SAVE_ERROR)
      else resolve(doc)
    });
  })
};

exports.update = function(doc) {
  return new Promise(function(resolve, reject) {
    if (!doc) reject(ResultMsg.PARAMS_ERROR)
    else {
      doc.save(function(err) {
        if (err) reject(ResultMsg.DB_ERROR)
        else resolve() 
      })
    } 
  })
}

/**
 * 根据topicId查询到最新的一条未删除回复
 * @param topicId 主题ID
 */
exports.getLastReplyByTopicId = function (topicId) {
  return new Promise(function(resolve, reject) {
    ReplyModel.findOne(
      {topic_id: topicId, deleted: false}, 
      '_id', 
      {sort: {create_at : -1}, 
      limit : 1}, 
      function(err, doc) {
        if (err) reject(ResultMsg.DB_ERROR)
        else resolve(doc)
    })
  })
};

exports.getRepliesByAuthorId = function (authorId, opt) {
  return new Promise(function(resolve, reject) {
    opt = !opt? null : opt
    ReplyModel.find({author_id: authorId}, {}, opt, function(err, docs) {
      if (err) reject(ResultMsg.DB_ERROR) 
      else resolve(docs)
    })
  })
};

// 通过 author_id 获取回复总数
exports.getCountByAuthorId = function (authorId) {
  return new Promise(function(resolve, reject) {
    ReplyModel.count({author_id: authorId}, function(err, count) {
      if (err) reject(ResultMsg.DB_ERROR)
      else resolve(count)
    })
  })
};
