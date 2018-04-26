'use strict';

const debug = require('debug')('bot-express:skill');
const line_event = require("../service/line-event");
const parse = require("../service/parser");

module.exports = class SkillGarbageCollection {

    constructor(){
        this.required_parameter = {
            garbage: {
                message_to_confirm: {
                    type: "text",
                    text: `Sure. Could you tell me what you like to dispose?`
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();
                    if (typeof value != "string") return reject();
                    parse.by_nlu(context.sender_language, "parse_garbage", value, resolve, reject);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error){
                        if (value === "") return resolve();

                        bot.change_message_to_confirm("garbage", {
                            type: "text",
                            text: "Sorry, I couldn't identify the garbage. Can you rephrase it?"
                        })
                        return resolve();
                    }

                    let garbages_text = "";
                    if (typeof value === "object" && value.length){
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
                    } else {
                        context.confirmed.garbage = [value];
                        garbages_text = value;
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
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    bot.queue({
                        type: "text",
                        text: `${context.confirmed.name}!! What an exciting name you have!`
                    })
                    return resolve();
                }
            },
            zip_code: {
                message_to_confirm: {
                    type: "text",
                    text: "Next, I would like to know where should we go to pick up the garbage. Can I have your zip code please?"
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();
                    if (typeof value != "string") return reject();
                    parse.zip_code(value, resolve, reject);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error){
                        if (error.message == "zip code format is incorrect."){
                            // Provide zip code is incorrect.
                            bot.change_message_to_confirm("zip_code", {
                                type: "text",
                                text: "The zip code seems incorrect. Could you make sure if it is correct?"
                            });
                            return resolve();
                        } else {
                            // While provided zip code is correct, zip code search is not working.
                            bot.queue({
                                type: "text",
                                text: "Sorry, our search system looks out of order."
                            });
                            bot.collect("address");
                            return resolve();
                        }
                    }

                    if (!value.resolved_address){
                        // While provided zip code seems correct, we could not find the address.
                        bot.queue({
                            type: "text",
                            text: "Sorry, I could not find the corresponding address."
                        });
                        bot.collect("address");
                        return resolve();
                    }

                    // It seems we could find the corresponding address.
                    // Set resolved address as city.
                    context.confirmed.city = context.confirmed.zip_code.resolved_address;
                    bot.collect("is_city_correct");
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
            is_city_correct: {
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    return resolve({
                        type: "template",
                        altText: `Your address would be "${context.confirmed.zip_code.resolved_address}". Is this correct?`,
                        template: {
                            type: "confirm",
                            text: `Your address would be "${context.confirmed.zip_code.resolved_address}". Is this correct?`,
                            actions: [
                                {type:"message", label:"Yes", text:"Yes"},
                                {type:"message", label:"No", text:"No"}
                            ]
                        }
                    });
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (value === "") return reject();
                    if (typeof value != "string") return reject();
                    parse.by_nlu(context.sender_language, "parse_yes_no", value, resolve, reject);
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    if (value == "Yes"){
                        // Going to collect remaining street address.
                        bot.collect("street");
                    } else if (value == "No"){
                        bot.collect({
                            zip_code: {
                                message_to_confirm: {
                                    type: "text",
                                    text: "Ops. Can I ask the address once again?"
                                }
                            }
                        });
                    }
                    return resolve();
                }
            },
            street: {
                message_to_confirm: {
                    type: "text",
                    text: "OK. Remaining street please."
                }
            },
            address: {
                message_to_confirm: {
                    type: "text",
                    text: "Do you mind asking address?"
                }
            },
            payment: {
                message_to_confirm: {
                    type: "template",
                    altText: `How would you like to pay for the fee?`,
                    template: {
                        type: "buttons",
                        text: `How would you like to pay for the fee?`,
                        actions: [
                            {type: "message", label: "LINE Pay", text: "LINE Pay"},
                            {type: "message", label: "At grocery Store", text: "Grocery Store"}
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
