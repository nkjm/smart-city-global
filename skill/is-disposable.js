'use strict';

const debug = require('debug')('bot-express:skill');
const parse = require("../service/parser");

module.exports = class SkillIsDisposable {

    constructor(){
        this.required_parameter = {
            garbage: {
                message_to_confirm: {
                    type: "text",
                    text: "大型ゴミで捨てれるかどうか確認したいもの教えてもらえますか？"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    parse.noun(value, resolve, reject);
                }
            }
        }

        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    finish(bot, event, context, resolve, reject){
        const not_disposables = ["テレビ", "掃除機", "オーディオ", "パソコン", "電子レンジ", "冷蔵庫", "トースター", "エアコン", "洗濯機"];
        let message;
        if (not_disposables.includes(context.confirmed.garbage[0])){
            message = {
                type: "text",
                text: `残念ながら${context.confirmed.garbage[0]}は電化製品なので大型ゴミでは捨てれません。購入した販売店かメーカーにお問い合わせください。`
            }
        } else {
            message = {
                type: "text",
                text: `はい、${context.confirmed.garbage[0]}は大型ゴミで出すことができます。`
            }
        }

        return bot.reply(message).then((response) => {
            return resolve();
        });
    }
};
