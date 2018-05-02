"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var amqp = require('amqp');
var v4_1 = __importDefault(require("uuid/v4"));
var Session = /** @class */ (function () {
    function Session(url, routingKey) {
        if (routingKey === void 0) { routingKey = 'celery'; }
        this.url = url;
        this.routingKey = routingKey;
    }
    Session.prototype.connect = function () {
        var _this = this;
        return new Promise(function (resolve) {
            _this.connection = amqp.createConnection({ url: _this.url });
            _this.connection.on('ready', resolve);
        });
    };
    Session.prototype.destroy = function () {
        this.connection.destroy();
    };
    Session.prototype.createResultQueue = function (taskID, handleMessage) {
        var resultQueueName = taskID.replace(/-/g, '');
        var q = this.connection.queue(resultQueueName, {
            exclusive: true,
            autoDelete: true,
            durable: true,
        });
        q.subscribe(function (msg) {
            if (msg.status === 'SUCCESS' || msg.status === 'FAILURE') {
                q.destroy();
            }
            handleMessage(msg);
        });
        return resultQueueName;
    };
    Session.prototype.generateProps = function (command, taskID, replyTo) {
        var ret = {
            contentType: 'application/json',
            correlationId: taskID,
            replyTo: replyTo,
            contentEncoding: 'utf-8',
            headers: {
                'id': taskID,
                'task': command,
            },
        };
        if (!replyTo) {
            delete ret['replyTo'];
        }
        return ret;
    };
    Session.prototype.generatePayload = function (args, kwargs) {
        return JSON.stringify([
            args,
            kwargs,
            null
        ]);
    };
    Session.prototype.execute = function (command, args, kwargs) {
        if (args === void 0) { args = []; }
        if (kwargs === void 0) { kwargs = {}; }
        if (!this.connection) {
            throw 'please "connect" before call';
        }
        var taskID = v4_1.default();
        var headers = this.generateProps(command, taskID);
        var payload = this.generatePayload(args, kwargs);
        this.connection.publish(this.routingKey, payload, headers);
    };
    Session.prototype.call = function (command, args, kwargs, handleOther) {
        var _this = this;
        if (args === void 0) { args = []; }
        if (kwargs === void 0) { kwargs = {}; }
        if (!this.connection) {
            throw 'please "connect" before call';
        }
        var taskID = v4_1.default();
        return new Promise(function (resolve, reject) {
            var replyTo = _this.createResultQueue(taskID, function (msg) {
                switch (msg.status) {
                    case 'SUCCESS': return resolve(msg.result);
                    case 'FAILURE': return reject(msg.result);
                    default: return handleOther && handleOther(msg);
                }
            });
            var headers = _this.generateProps(command, taskID, replyTo);
            var payload = _this.generatePayload(args, kwargs);
            _this.connection.publish(_this.routingKey, payload, headers);
        });
    };
    return Session;
}());
exports.Session = Session;
//# sourceMappingURL=index.js.map