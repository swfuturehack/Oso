
// Imports dependencies and set up http server
const 
  request = require('request'),
  express = require('express'),
  body_parser = require('body-parser'),
  app = express().use(body_parser.json()); // creates express http server

  //Text-generation 
  const textGeneration = require('./src/TextGeneration');
  const grammar = new textGeneration()

  const utils = require('./src/Utils');
  const helper = new utils();

  const wiki = require('./src/Wiki');
  const wikipedia = new wiki();

app.use(express.static(__dirname + '/dist'));

app.get('/*', (req,res)=>{
    res.sendFile(__dirname + '/dist/')
});
  
// Sets server port and logs message on success
const port =  process.env.PORT || 5000;
const server = app.listen(port, () => console.log('server connected.'));

//status
let status = {}; courses = {}; questions = {}; question = {}; questionType = {}; expectedAnswers = {};
let alphabets = "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z".split(",");


//socket.io
const io = require('socket.io')(server);

io.on('connect', function(socket) {
    //greeting
    let socketId = socket.id;
    // status[socketId] = "";
    let response = { "text": grammar.greetingText() }
    sendAPI(io, socketId, response);


    socket.on('send_message', function(data) {
      handleMessage(io, socketId, data);
    });
});


// Handles messages events
function handleMessage(io, receiverId, received_message) {
  // Check if the message contains text
  if (received_message.text){
    let intent = getClassifier(received_message.text.toString().toLowerCase().trim());
    if(received_message.text.toLowerCase().indexOf("wiki ") == 0){
      io.to(`${receiverId}`).emit('processing', "courses")
      var w = wikipedia.consult(received_message.text.toLowerCase().replace("wiki ", " "));
          w.then(function(result) {
            // response = {
            //   "text": result
            // }
            // sendAPI(io, receiverId, response);
            response = {
              "text": "Sorry, I've not gotten a good extract of Wikipedia."
            }
            sendAPI(io, receiverId, response);

          }).catch(function(error) {
            console.log(error);
          });
    }
    else if(status[receiverId] === "pending_answer"){
      if(questionType[receiverId] === "objective"){
        answerObjectiveQuestion(io, receiverId, received_message.text);
      }
      else if(questionType[receiverId] === "subjective"){
        answerSubjectiveQuestion(io, receiverId, received_message.text);
      }
    }else{
      if (intent === "begin"){

        response = {
          "text": grammar.infoText()
        }
        sendAPI(io, receiverId, response);      
      }
      else if (intent === "yes" || intent === "courses"){
        //pre message
        sendAPI(io, receiverId, { "text": "I can help you with any of the following courses 📚" });      
        io.to(`${receiverId}`).emit('processing', "courses")

        var initializeCourses = getCourses();
        initializeCourses.then(function(resultCourses) {
          courses[receiverId] = resultCourses;
          let elements = [];

          courses[receiverId].forEach((course) => {
            let element = {
                  "title": course.title + ": " + course.code.toUpperCase(),
                  "subtitle": "Tap start button to pick this course.",
                  "buttons": [
                    {
                      "type": "postback",
                      "title": "Start",
                      "payload": course.code.toUpperCase(),
                    }
                  ]
                };
            elements.push(element)                
          })
    
          // Create the payload for a basic text message
          response = {
            "template": {
              "type": "generic",
              "payload": elements
            }
          }
    
          sendAPI(io, receiverId, response);      
          console.log("courses loaded");
        }).catch(function(errorCourses) {
          console.log(errorCourses);
        })
      }
      else if (intent === "no"){
        restartDialog(io, receiverId);        
      }
      else if (courses){
        courseSelectedPostback(io, receiverId, received_message);
      }
      else {
        restartDialog(io, receiverId);
      }
    }

  }
}

function courseSelectedPostback(io, receiverId, received_message){
  if(courses[receiverId]){
    var classifier = require('./src/Classifier');
    let intent = new classifier().getCourseClassifications(courses[receiverId], received_message.text.toLowerCase());
    // Check if the message contains text
    if (received_message.text){
      courses[receiverId].forEach((course) => {
        if(course.code.toLowerCase() == received_message.text.toLowerCase() || course.code.toLowerCase() == intent){
          sendAPI(io, receiverId, { "text": course.title + " - " + course.code + " 📖"});
          setTimeout(()=>{
            io.to(`${receiverId}`).emit('processing', "questions")
          }, 1000);


          var initializeQuestions = getQuestions(course.code);
          initializeQuestions.then(function(resultQuestions) {
            console.log("questions loaded");
            questions[receiverId] = helper.shuffle(resultQuestions);

            getPaper(io, receiverId)
            
          }).catch(function(errorQuestions) {
            console.log(errorQuestions);
          })
        }   
      });  
    }
  }
}

async function answerObjectiveQuestion(io, receiverId, userAnswer){
  let intent = getClassifier(userAnswer.toString().toLowerCase().trim())
  if(expectedAnswers[receiverId].indexOf(userAnswer.toString().toLowerCase().trim()) > -1){
    const newQuestionAnswer = question[receiverId].answer;
    if(question[receiverId].options[alphabets.indexOf(userAnswer.toString().toLowerCase().trim())].toString().toLowerCase().trim() === newQuestionAnswer.toString().toLowerCase().trim()){    
      sendAPI(io, receiverId, { "text": grammar.correctEmoji() + " Correct!"});
    }else{
      await sendAPI(io, receiverId, { "text": grammar.wrongEmoji() + " Wrong! \n\n The correct answer is " + question[receiverId].answer});    
    }  

    //next question
    questions[receiverId].pop()
    getPaper(io, receiverId)
  }
  else if (intent === "end"){
    restartDialog(io, receiverId)
  }

}

async function answerSubjectiveQuestion(io, receiverId, userAnswer){
  let distance =  getAnswerClassifications(receiverId, userAnswer.toString().toLowerCase().trim())
  if(userAnswer.toString().toLowerCase().trim().match(/end|stop|cancel|restart|done|bye|later|over|quit|change|clear/g)){
    response = {
      "text": grammar.pardonText()
    }    
    sendAPI(io, receiverId, response);
    setTimeout(function(){
      restartDialog(io, receiverId)
    }, 1000)

  } else {
    if(distance >= 0.7){
      sendAPI(io, receiverId, { "text": grammar.correctEmoji() + " Correct! \n\n I would've said " + question[receiverId].answer});
    } else {
      await sendAPI(io, receiverId, { "text": grammar.wrongEmoji() + " Wrong! \n\n The correct answer is " + question[receiverId].answer});    
    }

    //next question
    questions[receiverId].pop()
    getPaper(io, receiverId)
  }
  // let intent = getClassifier(userAnswer.toString().toLowerCase().trim())
  // if (intent === "end"){
  //   restartDialog(io, receiverId)
  // }

}

function sendAPI(io, receiverId, received_message) {
    console.log(received_message)
    io.to(`${receiverId}`).emit('new_message', received_message)
}

function checkCourse(io, receiverId, data){
  // console.log(data)
}

//nlp
function getClassifier(input){
  var classifier = require('./src/Classifier');
  let result = new classifier().getValue(input)
  return result
}
function getObjectiveClassifier(input){
  var classifier = require('./src/Classifier');
  let result = new classifier().getObjectiveOption(input)
  return result
}

function getAnswerClassifications(receiverId, input){
  var classifier = require('./src/Classifier');
  let result = new classifier().getAnswerClassifications(expectedAnswers[receiverId], input)
  return result.toString(); 
}

function restartDialog(io, receiverId){
  courses[receiverId] = null 
  questions[receiverId] = null 
  question[receiverId] = null
  questionType[receiverId] = null
  expectedAnswers[receiverId] = null
  status[receiverId] = null
  sendAPI(io, receiverId, { "text": grammar.restarterText() });  
}

function getCourses(){
  // Return new promise 
  return new Promise(function(resolve, reject) {
    // Setting URL and headers for request
    var options = {url: 'https://qui-ndc.herokuapp.com/api/courses', headers: {'User-Agent': 'request'}};

    // Do async job
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      } else {
        let data = JSON.parse(body);
        resolve(data);
      }
    })
   })
}

function getQuestions(coursecode){
  // Return new promise 
  return new Promise(function(resolve, reject) {
    // Setting URL and headers for request
    var options = {url: 'https://qui-ndc.herokuapp.com/api/questions/'+coursecode, headers: {'User-Agent': 'request'}};

    // Do async job
    request.get(options, function(err, resp, body) {
      if (err) {
        reject(err);
      } else {
        let data = JSON.parse(body);
        resolve(data);
      }
    })
   })
}

function getPaper(io, receiverId){
  setTimeout(()=>{
    io.to(`${receiverId}`).emit('processing', "courses")
    let questionsLength = questions[receiverId].length
    if(questionsLength> 0){
      question[receiverId] = questions[receiverId][questionsLength-1]
      const newQuestion = question[receiverId];
      let optionsString  = ""
      const newOptions = newQuestion.options;
      const newAnswer = newQuestion.answer;
      if(newOptions && newOptions.length > 0){
        questionType[receiverId] = "objective"
        expectedAnswers[receiverId] = []
        newOptions.forEach((option,index) => {
          const alphabet = alphabets[index];
          optionsString += "\r"+alphabet.toLocaleUpperCase() + ". " + option + "\n\n"
          expectedAnswers[receiverId].push(alphabet.toLowerCase())
        });  
      }
      else{
        questionType[receiverId] = "subjective"
        expectedAnswers[receiverId] = newAnswer.toString().toLowerCase()
      }

      status[receiverId] = "pending_answer"
      setTimeout(function(){
        sendAPI(io, receiverId, { "text": "Question: " + newQuestion.question + "\n\n"});      
      }, 500)

      setTimeout(function(){
        if(questionType[receiverId] === "objective"){
          sendAPI(io, receiverId, { "text": optionsString + "\n\n"});      
          getOptions(io, receiverId)
        }
        else if(questionType[receiverId] === "subjective"){
          sendAPI(io, receiverId, { "text": "waiting for reply.."});
        }
      }, 500)  
    } else {
      restartDialog(io, receiverId)
    }
  }, 2000);

}

function getOptions(io, receiverId){
  question[receiverId] = questions[receiverId][questions[receiverId].length-1]
  let options = [];
  question[receiverId].options.forEach((option,index) => {
    let item = {
      "content_type": "text",
      "title": alphabets[index].toLocaleUpperCase(),
      "payload": option
    };
    options.push(item)
  });

  setTimeout(function(){
    sendAPI(io, receiverId, { "text": "waiting for reply..", "quick_replies": options });
  }, 500)

}