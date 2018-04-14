const {RestApp} = require('bb-rest')

// ignore the certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

// set keys and such for blackboard requests
let origin = 'https://ec2-35-169-107-184.compute-1.amazonaws.com/'
let key = '82c0762a-ae8a-4b65-80ce-e2b911cb09fc'
let secret = '1u5X4KfR6VVtS0iDr4UTDs1bZRKBeUsC'
let myApp = new RestApp(origin, key, secret)

// Creating a unique id for each course created
let ID = () => {
  return Math.random().toString(36).substr(2, 9)
}

// Creating a sample course description
let courseDescription = (name) => {
  description = `Example course for ${name}.`
  return description
}

// Create the getClass method for getting the class name from BB
getClass = (callback) => {
  myApp.get('courses', {
    complete: (error, response, body) => {
      response.setEncoding('utf8')
      callback(response.body.results)
    }
  })
}

createCourse = (callback, courseName) => {
  myApp.post('courses', {
    data: {name: courseName, description: courseDescription(courseName), courseId: ID()},
    complete: (error, response, body) => {
      response.setEncoding('utf8')
      callback(response.body)
    }
  })
}

createAnnouncement = (callback, title, announcement) => {
  myApp.post('announcements', {
    data: {title: title, body: announcement, showAtLogin: true},
    complete: (error, response, body) => {
      response.setEncoding('utf8')
      callback(response.body)
    }
  })
}

function delegateSlotCollection(){
  console.log("in delegateSlotCollection");
  console.log("current dialogState: "+this.event.request.dialogState);
    if (this.event.request.dialogState === "STARTED") {
      console.log("in Beginning");
      var updatedIntent=this.event.request.intent;
      //optionally pre-fill slots: update the intent object with slot values for which
      //you have defaults, then return Dialog.Delegate with this updated intent
      // in the updatedIntent property
      this.emit(":delegate", updatedIntent);
    } else if (this.event.request.dialogState !== "COMPLETED") {
      console.log("in not completed");
      // return a Dialog.Delegate directive with no updatedIntent property.
      this.emit(":delegate");
    } else {
      console.log("in completed");
      console.log("returning: "+ JSON.stringify(this.event.request.intent));
      // Dialog is now complete and all required slots should be filled,
      // so call your normal intent handler.
      return this.event.request.intent;
    }
}

// Requiring Alexa
let Alexa = require('alexa-sdk');

exports.handler = function(event, context, callback){
  let alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};

// Handlers
let handlers = {
  'LaunchRequest': function () {
    this.response.speak("Welcome to Blackboard help. What would you like to do?").listen("Please say that again?")
    this.emit(":responseReady")
  },
  // Get courses that exist
  'GetClass': function() {

    getClass((data) => {
      let outputSpeech = `There are currently ${data.length} classes. `

      for (let i = 0; i < data.length; i++) {
        if (i === 0) {
          outputSpeech = outputSpeech + 'The classes are: ' + data[i].name + ', '
        } else if (i === data.length-1) {
          outputSpeech = outputSpeech + 'and ' + data[i].name + '.'
        } else {
          outputSpeech = outputSpeech + data[i].name + ', '
        }
      }

      this.emit(':tell', outputSpeech)
    })
  },
  // Create a course
  'CreateCourse': function() {
    let fillSlots = delegateSlotCollection.call(this)
    let className = this.event.request.intent.slots.class.value
    createCourse((data) => {
      this.response.speak(`Okay, ${this.event.request.intent.slots.class.value} was created.`)
      this.emit(':responseReady')
    }, className)
  },
  'CreateAnnouncement': function() {
    let fillSlots = delegateSlotCollection.call(this)
    let title = this.event.request.intent.slots.title.value
    let body = this.event.request.intent.slots.body.value
    createAnnouncement((data) => {
      this.response.speak(`Okay, the announcement with the title ${title} was posted.`)
      this.emit(':responseReady')
    }, title, body)
  },
  'AMAZON.HelpIntent': function () {
      this.emit(':ask', "What can I help you with?", "How can I help?");
  },
  'AMAZON.CancelIntent': function () {
      this.emit(':tell', "Okay!");
  },
  'AMAZON.StopIntent': function () {
      this.emit(':tell', "Goodbye!");
  }
};