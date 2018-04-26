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

    describe("Test show-disposable-garbage skill from " + emu.messenger_type, function(){
        let user_id = "show-disposable-garbage";

        describe("Identifiable question", function(){
            it("will answer disposable garbage.", function(){
                this.timeout(8000);

                return emu.clear_context(user_id).then(function(){
                    let event = emu.create_message_event(user_id, "どんなゴミが大型ゴミでだせますか？");
                    return emu.send(event);
                }).then(function(context){
                    context.intent.name.should.equal("show-disposable-garbage");
                    context.previous.message[0].message.text.should.equal(`原則として、一般家庭から排出される1辺又は長さが50センチメートル以上、2メートル未満のごみ（例外もございます）が該当します。なお、1個の重量が100キログラムを超えるものや、長さ2メートルを超えるものは、市では収集できません。また、次の14品目は、特別大型ごみに指定されています。\n\nオルガン（電子オルガンは専門業者へ）\nサイドボード\n食器棚\nスプリング入りマットレス\nソファー\n畳\nタンス（1棹単位）\n流し台\nベッド\n物置（解体して束ねた数・1束1点）\n門柱（門扉含む）\n浴槽\n机\n書棚`)
                });
            });
        });
    });
}
