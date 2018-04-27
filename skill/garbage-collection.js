'use strict';

const debug = require('debug')('bot-express:skill');
const line_event = require("../service/line-event");
const parse = require("../service/parser");
const msg = require("../service/message");

module.exports = class SkillGarbageCollection {

    constructor(){
        this.required_parameter = {
            garbage: {
                message_to_confirm: {
                    type: "text",
                    text: `Sure. Could you tell me what you like to dispose?`
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();
                    if (value === "") return reject();

                    parse.by_nlu(context.sender_language, "parse_garbage", value, resolve, reject);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error){
                        if (value === "") return resolve();
                        if (value === []) return resolve();

                        bot.change_message_to_confirm("garbage", {
                            type: "text",
                            text: "Sorry, I couldn't identify the garbage. Can you rephrase it?"
                        })
                        return resolve();
                    }

                    let garbages_text = "";
                    if (typeof value === "string"){
                        context.confirmed.garbage = [value];
                        garbages_text = value;
                    } else if (typeof value === "object"){
                        if (value.length && value.length === 1){
                            context.confirmed.garbage = value;
                            garbages_text = value[0];
                        } else if (value.length && value.length > 1){
                            // There are more than 1 garbage.
                            let offset = 1;
                            for (let garbage of value){
                                garbages_text += garbage;
                                if (offset === value.length){
                                    break;
                                }
                                garbages_text += " and ";
                                offset++;
                            }
                        }
                    }

                    bot.queue({
                        type: "text",
                        text: `${garbages_text}. I got it.`
                    });
                    return resolve();
                },
                sub_skill: ["show-disposable-garbage","is-disposable"]
            },
            name: {
                message_to_confirm: {
                    type: "text",
                    text: "Can I have your name please?"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();
                    if (typeof value != "string") return reject();

                    return resolve(value);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    if (value.match(/macho/i)){
                        bot.queue({
                            type: "text",
                            text: `${context.confirmed.name}!! What an exciting name you have!!`
                        })
                    } else {
                        bot.queue(msg.random([{
                            type: "text",
                            text: `${context.confirmed.name}, sounds great.`
                        },{
                            type: "text",
                            text: `${context.confirmed.name}, not bad.`
                        }]));
                    }

                    return resolve();
                }
            },
            address: {
                message_to_confirm: {
                    type: "template",
                    altText: "Next, I would like to know where should we go to pick up the garbage.",
                    template: {
                        type: "buttons",
                        text: "Next, I would like to know where should we go to pick up the garbage.",
                        actions: [
                            {type:"uri", label:"Current location", uri:"line://nv/location"}
                        ]
                    }
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();

                    if (typeof value === "string"){
                        return resolve(value);
                    }

                    if (typeof value === "object"){
                        if (value.address) return resolve(value.address);
                    }
                    return reject();
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    bot.queue({
                        type: "text",
                        text: `All right, we'll go and pick up at ${value}.`
                    })
                    return resolve();
                }
            },
            date: {
                message_to_confirm: {
                    type: "template",
                    altText: "When do you want us to pick up?",
                    template: {
                        type: "buttons",
                        text: "When do you want us to pick up?",
                        actions: [
                            {type: "datetimepicker", label:"Select date", mode:"date", data:"date"}
                        ]
                    }
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value == "string"){
                        return parse.by_nlu(context.sender_language, "parse_date", value, resolve, reject);
                    }

                    // In case of LINE postback.
                    if (value.params && value.params.date) return resolve(value.params.date);

                    return reject();
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    bot.queue({
                        type: "text",
                        text: `Copy that. We gonna pick up on ${value}`
                    })

                    if (bot.type === "google"){
                        context.confirmed.payment = "Grocery Store";
                        return resolve();
                    }
                    bot.collect("payment");
                    return resolve();
                }
            }
        }

        this.optional_parameter = {
            payment: {
                message_to_confirm: {
                    type: "template",
                    altText: `How would you like to pay for the fee?`,
                    template: {
                        type: "buttons",
                        text: `How would you like to pay for the fee?`,
                        actions: [
                            {type: "message", label: "LINE Pay", text: "LINE Pay"},
                            {type: "message", label: "At Grocery Store", text: "Grocery Store"}
                        ]
                    }
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();
                    if (typeof value != "string") return reject();
                    parse.by_nlu_with_list(context.sender_language, "parse_payment", value, ["LINE Pay", "Grocery Store"], resolve, reject);
                }
            }
        }

        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    finish(bot, event, context, resolve, reject){
        let address = context.confirmed.address || context.confirmed.city + context.confirmed.street;
        let name = context.confirmed.name;

        if (context.confirmed.payment === "Grocery Store"){
            return bot.reply({
                type: "text",
                text: `${name}-san, your request for collecting garbage has been processed successfully.`
            }).then((response) => {
                return resolve();
            })
        }

        // Payment should be LINE Pay
        return bot.reply({
            type: "text",
            text: `All right, we almost finish. Please go ahead to the payment and your request will complete once the payment settled.`
        }).then((response) => {
            return line_event.fire({
                type: "bot-express:push",
                to: {
                    type: "user",
                    userId: bot.extract_sender_id()
                },
                intent: {
                    name: "pay",
                    parameters: {
                        productName: "Garbage collection",
                        amount: 600 * context.confirmed.garbage.length,
                        currency: "JPY",
                        orderId: `${bot.extract_sender_id()}-${Date.now()}`,
                        message_text: `LINE Pay`
                    }
                },
                language: context.sender_language
            });
        }).then((response) => {
            return resolve();
        });
    }
};
