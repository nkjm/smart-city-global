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

    describe("Test garbage-collection skill from " + emu.messenger_type, function(){
        let user_id = "garbage-collection";

        describe("Unidentifiable garbage", function(){
            it("will ask garbage again.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "大型ゴミを出したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("garbage-collection");
                    context.confirming.should.equal("garbage");
                    let event = emu.create_message_event(user_id, "旦那");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("garbage");
                });
            });
        });

        describe("Identifiable garbage", function(){
            it("will go to next question.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "大型ゴミを出したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("garbage-collection");
                    context.confirming.should.equal("garbage");
                    let event = emu.create_message_event(user_id, "ソファ");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[1].message.text.should.equal("ソファですね、了解です。");
                    context.confirmed.garbage.should.deep.equal(["ソファ"]);
                    context.confirming.should.equal("name");
                });
            });
        });

        describe("Multiple identifiable garbage", function(){
            it("will identify all of them", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "大型ゴミを出したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("garbage-collection");
                    context.confirming.should.equal("garbage");
                    let event = emu.create_message_event(user_id, "ソファとタンス");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[1].message.text.should.equal("ソファとタンスですね、了解です。");
                    context.confirmed.garbage.should.deep.equal(["ソファ","タンス"]);
                    context.confirming.should.equal("name");
                });
            });
        });

        describe("Ask if the garbage is disposable in the middle of the conversation", function(){
            it("will reserve payment and provide payment url.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "大型ゴミを出したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("garbage-collection");
                    context.confirming.should.equal("garbage");
                    let event = emu.create_message_event(user_id, "ソファは大型ゴミでだせますか？");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("garbage");
                    let event = emu.create_message_event(user_id, "ではソファをお願いします");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[1].message.text.should.equal("ソファですね、了解です。");
                    context.confirmed.garbage.should.deep.equal(["ソファ"]);
                    context.confirming.should.equal("name");
                });
            });
        });

        describe("Ask what kind of garbage can be disposed in the middle of the conversation", function(){
            it("will reserve payment and provide payment url.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "大型ゴミを出したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("garbage-collection");
                    context.confirming.should.equal("garbage");
                    let event = emu.create_message_event(user_id, "大型ゴミでだせるゴミはどんなものがありますか？");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[0].message.text.should.equal("原則として、一般家庭から排出される1辺又は長さが50センチメートル以上、2メートル未満のごみ（例外もございます）が該当します。なお、1個の重量が100キログラムを超えるものや、長さ2メートルを超えるものは、市では収集できません。また、次の14品目は、特別大型ごみに指定されています。\n\nオルガン（電子オルガンは専門業者へ）\nサイドボード\n食器棚\nスプリング入りマットレス\nソファー\n畳\nタンス（1棹単位）\n流し台\nベッド\n物置（解体して束ねた数・1束1点）\n門柱（門扉含む）\n浴槽\n机\n書棚");
                    context.confirming.should.equal("garbage");
                    let event = emu.create_message_event(user_id, "ではソファをお願いします");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[1].message.text.should.equal("ソファですね、了解です。");
                    context.confirmed.garbage.should.deep.equal(["ソファ"]);
                    context.confirming.should.equal("name");
                });
            });
        });

        describe("Perfect reply and user select LINE Pay", function(){
            it("will reserve payment and provide payment url.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "大型ゴミを出したいのですが");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("garbage-collection");
                    context.confirming.should.equal("garbage");
                    let event = emu.create_message_event(user_id, "ソファ");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("name");
                    let event = emu.create_message_event(user_id, "中嶋一樹");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("is_name_correct");
                    let event = emu.create_message_event(user_id, "はい");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("zip_code");
                    let event = emu.create_message_event(user_id, "107-0062");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("is_city_correct");
                    let event = emu.create_message_event(user_id, "はい");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("street");
                    let event = emu.create_message_event(user_id, "1-1");
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("date");
                    let event = emu.create_postback_event(user_id, {
                        params: {
                            date: "2018-12-31"
                        }
                    });
                    return emu.send(event);
                }).then(function(context){
                    context.confirming.should.equal("payment");
                    let event = emu.create_message_event(user_id, "LINE Pay");
                    return emu.send(event);
                }).then(function(context){
                    context.previous.message[0].message.text.should.equal("大型ゴミの収集を承りました。");
                });
            });
        });
    });
}
