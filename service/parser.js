"use strict";

const debug = require('debug')('bot-express:service');
const mecab = require("mecabaas-client");
const zip_code = require("../service/zip-code");
const nlu = require("../service/dialogflow");
const default_lang = "en";
Promise = require('bluebird');

module.exports = class ServiceParser {
    static identify(lang, parameter_name, value){
        debug("Going to identify value by NLU.");
        if (!lang) lang = default_lang;
        return nlu.query(lang, value).then((response) => {
            if (response.status.code != 200){
                debug(response.status.errorDetails);
                return Promise.reject(new Error(response.status.errorDetails));
            }

            if (response.result.parameters[parameter_name] === undefined){
                debug("Entity not found.");
                return null;
            }

            debug("Found entity.");
            return response.result.parameters[parameter_name];
        })
    }

    static zip_code(value, resolve, reject){
        if (!value) return reject();

        return zip_code.search(value).then(
            (response) => {
                // In case we could not find the address.
                if (response === null){
                    return resolve({
                        zip_code: value,
                        resolved_address: null
                    });
                }

                // In case we could find the address.
                let address = response.address1 + response.address2 + response.address3;
                return resolve({
                    zip_code: value,
                    resolved_address: address
                });
            },
            (response) => {
                return reject(response);
            }
        );
    }

    static by_list(value, acceptable_values, resolve, reject){
        if (acceptable_values.includes(value)){
            debug("Accepted the value.");
            return resolve(value);
        }
        return reject();
    }

    static by_nlu_with_list(lang, parameter_name, value, acceptable_values, resolve, reject){
        debug("Going to understand value by NLU.");

        if (!lang) lang = default_lang;
        if (!value) return reject();

        return nlu.query(lang, value).then((response) => {
            if (response.status.code != 200){
                debug(response.status.errorDetails);
                return reject();
            }

            if (response.result.parameters[parameter_name]){
                debug("Found entities.");
                if (acceptable_values.includes(response.result.parameters[parameter_name])){
                    debug("Accepted the value.");
                    return resolve(response.result.parameters[parameter_name]);
                }
            }
            return reject();
        })
    }

    static by_nlu(lang, parameter_name, value, resolve, reject){
        debug("Going to identify value by NLU.");

        if (!lang) lang = default_lang;
        if (!value) return reject();

        return nlu.query(lang, value).then((response) => {
            if (response.status.code != 200){
                debug(response.status.errorDetails);
                return Promise.reject(new Error(response.status.errorDetails));
            }

            if (response.result.parameters[parameter_name] === undefined){
                debug("Entity not found.");
                return reject();
            }

            debug("Found entity.");
            return resolve(response.result.parameters[parameter_name]);
        })
    }
}
