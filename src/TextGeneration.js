//Text-generation 
//context free grammar with production rules
var rita = require('rita');
module.exports = class TextGeneration {
    greetingText() {
        let rg = rita.RiGrammar()
        rg.addRule('<start>', "<STMT>")
        rg.addRule('<STMT>', "<CPMT> | <CPMT> <EMOJI> | <CPMT> <EMOJI>.. <O> | <EMOJI> <CPMT> | <EMOJI>.. <O>")
        rg.addRule('<CPMT>', "Welcome | Hi | Hello")
        rg.addRule('<O>', "what's up? | how's you? | how're you?")
        rg.addRule('<EMOJI>', "😃 | 😀")
        let result = rg.expand();
               
        return result; 
    }  
    infoText() {
        let rg = rita.RiGrammar()
        rg.addRule('<start>', "I'm <S> <EMOJI>, I can <SV> you do <N> for your <O>. <QT> <V> together?")
        rg.addRule('<S>', 'Oso | an assistant bot')
        rg.addRule('<EMOJI>', "🤓")
        rg.addRule('<N>', 'revision | preparation | look over again')
        rg.addRule('<QT>', "Do you want us to | Can we | I'd love we")
        rg.addRule('<SV>', 'assist | help | guide')
        rg.addRule('<O>', 'examination | test | assessment')
        rg.addRule('<V>', 'revise | prepare | study')
        let result = rg.expand();
               
        return result; 
    }  
    pardonText() {
        let rg = rita.RiGrammar()
        rg.addRule('<start>', "<POL> incase I'm wrong, <STMT> <EMOJI>")
        rg.addRule('<EMOJI>', "🙄 | 😤 | 😕 | ☹ | 😟")
        rg.addRule('<POL>', "Please | Sorry | pardon me")
        rg.addRule('<STMT>', "<S> is <INT> to <V>. | <GERUND> meaning from <S> is <INT>.")
        rg.addRule('<S>', "natural language | human language")
        rg.addRule('<INT>', 'complex | difficult | ambigious')
        rg.addRule('<V>', 'process | understand | comprehend')
        rg.addRule('<GERUND>', "extracting | reading")
        let result = rg.expand();
               
        return result; 
    }  
    restarterText() {
        let rg = rita.RiGrammar()
        rg.addRule('<start>', "<INJ>, <NP> <VP> | <CRRT>")
        rg.addRule('<INJ>', 'Ok | Alright | No problem | Good')
        rg.addRule('<NP>', 'lets | Can we')
        rg.addRule('<VP>', 'take a break 🤔️ | change focus. | 🤦‍️ deviate from this <O>.')
        rg.addRule('<O>', 'course | subject | area')
        rg.addRule('<CRRT>', "<POL>, <DIR>")
        rg.addRule('<POL>', "Please | Hello | Hey!")
        rg.addRule('<DIR>', "can you be more specific? 🤔 | don't confuse me for the sake of my sanity. 🤷‍ | how can I help you?")
        let result = rg.expand();
        
        return result; 
    }  
    correctEmoji() {
        let rg = rita.RiGrammar()
        rg.addRule('<start>', "<EMOJI>")
        rg.addRule('<EMOJI>', "😉 | 👌 | 👍 | 👏 | 🤭 | 🤗")
        let result = rg.expand();
               
        return result; 
    }  
    wrongEmoji() {
        let rg = rita.RiGrammar()
        rg.addRule('<start>', "<EMOJI>")
        rg.addRule('<EMOJI>', "😒 | 😏 | 👎 | 😜")
        let result = rg.expand();
               
        return result; 
    }  

}