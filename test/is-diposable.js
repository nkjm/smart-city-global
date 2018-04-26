"use strict";

require("dotenv").config();

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const Emulator = require("../test-util/emulator");
const messenger_options = [{
    name: "line",
    options: {
        line_channel_secret: process.env.LINE_CHANNEL_SECRET
    }
}];

chai.use(chaiAsPromised);
const should = chai.should();

for (let messenger_option of messenger_options){
    let emu = new Emulator(messenger_option.name, messenger_option.options);

    describe("Test is-disposable skill from " + emu.messenger_type, function(){
        let user_id = "is-disposable";

        describe("Not diposable garbage", function(){
            it("will answer no.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "洗濯機は大型ゴミで出せますか？");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("is-disposable");
                    context.previous.message[0].message.text.should.equal(`残念ながら洗濯機は電化製品なので大型ゴミでは捨てれません。購入した販売店かメーカーにお問い合わせください。`)
                });
            });
        });

        describe("Diposable garbage", function(){
            it("will answer yes.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "タンスは大型ゴミで出せますか？");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("is-disposable");
                    context.previous.message[0].message.text.should.equal(`はい、タンスは大型ゴミで出すことができます。`)
                });
            });
        });
    });
}
