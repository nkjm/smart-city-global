"use strict";

require("dotenv").config();

const debug = require('debug')('bot-express:skill');
const cache = require("memory-cache");
const Pay = require("line-pay");
const pay = new Pay({
    channelId: process.env.LINE_PAY_CHANNEL_ID,
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
    hostname: process.env.LINE_PAY_HOSTNAME
});

module.exports = class SkillPay {

    constructor(){
        this.required_parameter = {
            productName: {},
            amount: {},
            currency: {},
            orderId: {},
            message_text: {}
        }

        this.optional_parameter = {
            confirmUrl: {},
            confirmUrlType: {}
        }

        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    finish(bot, event, context, resolve, reject){
        let reservation = {
            productName: context.confirmed.productName,
            amount: context.confirmed.amount,
            currency: context.confirmed.currency,
            orderId: context.confirmed.orderId,
            confirmUrl: context.confirmed.confirmUrl || process.env.LINE_PAY_CONFIRM_URL,
            confirmUrlType: context.confirmed.confirmUrlType || "SERVER"
        }

        // Call LINE Pay reserve API.
        return pay.reserve(reservation).then((response) => {
            reservation.transactionId = response.info.transactionId;
            reservation.userId = bot.extract_sender_id();
            reservation.language = context.sender_language;
            cache.put(reservation.orderId, reservation);

            // Now we can provide payment URL.
            return bot.reply({
                type: "template",
                altText: context.confirmed.message_text,
                template: {
                    type: "buttons",
                    text: context.confirmed.message_text,
                    actions: [
                        {type: "uri", label: `Pay ${reservation.amount} yen`, uri: response.info.paymentUrl.web}
                    ]
                }
            });
        }).then((reponse) => {
            return resolve();
        })
    }
};
