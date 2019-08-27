//natural language processing and understanding
module.exports = class aural {
    constructor(){
        this.classifier = new require('./Classifier');
    }
    getClassifier(input){
      let result = this.classifier.getValue(input)
      return result
    }
    getObjectiveClassifier(input){
      let result = this.classifier.getObjectiveOption(input)
      return result
    }

    getAnswerClassifications(input){
      let result = this.classifier.getAnswerClassifications(expectedAnswers, input)
      return result.toString(); 
    }
}