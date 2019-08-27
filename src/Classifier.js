const natural = require('natural');
const greetingData = require("./dataset/begin")
const endData = require("./dataset/end")
const coursesData = require("./dataset/courses")
const yesData = require("./dataset/yes")
const noData = require("./dataset/no")
const whData = require("./dataset/wh")

module.exports = class Classifier {
    getValue(input) {
        var classifier = new natural.BayesClassifier();

        //yes
        yesData.forEach((item)=>{
            classifier.addDocument(item.text, "yes")
        });

        //no
        noData.forEach((item)=>{
            classifier.addDocument(item.text, "no")
        });
         
        //begin
        greetingData.forEach((item)=>{
            classifier.addDocument(item.text, "begin")
        });

        //end
        endData.forEach((item)=>{
            classifier.addDocument(item.text, "end")
        });

         //wh question
         whData.forEach((item)=>{
            classifier.addDocument(item.text, "wh")
        });

        //courses
        coursesData.forEach((item)=>{
            classifier.addDocument(item.text, "courses")
        });
        
       classifier.train();
                        
        return classifier.classify(input); 
    }   
    getObjectiveOption(input) {
        var classifier = new natural.BayesClassifier();

        //objective
        classifier.addDocument('a', 'objective');
        classifier.addDocument('b', 'objective');
        classifier.addDocument('c', 'objective');
        classifier.addDocument('d', 'objective');
        classifier.addDocument('e', 'objective');

        classifier.train();
                        
        return classifier.classify(input); 
    }  
    getAnswerClassifications(expectedValue,input) {
        
        return natural.JaroWinklerDistance(expectedValue,input); 
    }  
    getCourseClassifications(courses,input) {
        
        let coursecode = ""
        let max = 0
        for(let i = 0; i < courses.length; i++){
            let course = courses[i]
            let distance =  natural.JaroWinklerDistance(course.code.toLowerCase(),input.replace("want","").replace("take","")); 
            let matchedSubStr = input.replace(/\s/g,'').includes(course.code.toLowerCase());
            if((distance >= 0.5 && distance > max) || matchedSubStr){
              max = distance
              coursecode = course.code.toLowerCase()
            }
        }
        return coursecode;
    }  
}