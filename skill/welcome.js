"use strict";

module.exports = class SkillWelcome {
    finish(bot, event, context, resolve, reject){
        bot.plugin.google.sdk.ask("東京都千代田区住民サービス課です。今日はどうされましたか？");
        return resolve();
    }
}
