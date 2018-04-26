'use strict';

const debug = require('debug')('bot-express:skill');
const parse = require("../service/parser");

module.exports = class SkillIsDisposable {

    constructor(){
        this.required_parameter = {
            garbage: {
                message_to_confirm: {
                    type: "text",
                    text: "What would you like to confirm?"
                }
            }
        }

        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    finish(bot, event, context, resolve, reject){
        return parse.identify(bot.sender_language, "parse_garbage", context.confirmed.garbage).then((response) => {
            let text;
            if (response){
                text = `You can trash ${context.confirmed.garbage}.`;
            } else {
                text = `You cannot trash ${context.confirmed.garbage}.`;
            }
            return bot.reply({
                type: "text",
                text: text
            })
        }).then((response) => {
            return resolve();
        });
    }
};
