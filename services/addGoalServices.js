var mysql = require("./sqlconnect.js");
var Goal = require("../model/goal");
var Question = require("../model/question");
var QResponse = require("../model/qresponse");
var Response = require("../model/response");

// MC =0, FR = 1, L = 2
module.exports = {
  addGoalExecutive: async function(goalData, currExecutive) {
    var today = new Date();

    const [rowsTest, fieldsTest] = await mysql.connect.execute("SELECT * FROM goals WHERE title = ? AND executive_id = ?", [goalData.goalTitle, currExecutive.executive_id]);
    if (rowsTest.length) {
      console.log("IT IS NOT NULL");
      console.log("TITLE: " + goalData.goalTitle);
      console.log("EXEC ID: " + currExecutive.executive_id);
      return;
    }

    await mysql.connect.execute("INSERT INTO goals(coach_id, executive_id, title, description, progress, frequency, date_assigned) VALUES(?, ?, ?, ?, ?, ?, ?);", [-1,currExecutive.executive_id, goalData.goalTitle, "", 0, goalData.frequency, today]);
    console.log("added goal");
    // const [rows, fields] = await mysql.connect.execute("SELECT * FROM goals WHERE executive_id = ?", [currExecutive.executive_id]);
    // var getStatement = "SELECT * FROM goals WHERE title = ? AND executive_id = ?", [goalData.goalTitle, currExecutive.executive_id]);
    // const [rows, fields] = await mysql.connect.execute(getStatement);
    const [rows, fields] = await mysql.connect.execute("SELECT * FROM goals WHERE title = ? AND executive_id = ?", [goalData.goalTitle, currExecutive.executive_id]);
    console.log(rows);
    const currGoalArray = rows.map(x => new Goal.Goal(x));
    const currGoal = currGoalArray[0];


    // console.log("BEfore we add it, this is the length of goals list " + currExecutive.goals_list.length);
    // currExecutive.addGoal(currGoal);
    // console.log("currGoal is " + currGoal.id + " and currExecutive is " + currExecutive.name);
    // console.log("THIS EXECUTIVES GOALS HAS " + currExecutive.goals_list.length + " goals");
    //console.log(goalData.mcQuestions.length);
    if (goalData.mcQuestions != null) {
      for (var i=0; i<goalData.mcQuestions.length; i++) {
        var choices = "";
        for (var j=1; j<goalData.mcQuestions[i].length; j++) {
          choices += goalData.mcQuestions[i][j] + ",";
        }
        await mysql.connect.execute("INSERT INTO questions(goal_id, title, type, qs) VALUES(?, ?, ?, ?);", [currGoal.id ,goalData.mcQuestions[i][0], 0, choices]);
      }
    }
    if (goalData.frQuestions != null) {
      for (var i=0; i<goalData.frQuestions.length; i++) {
        await mysql.connect.execute("INSERT INTO questions(goal_id, title, type, qs) VALUES(?, ?, ?, ?);", [currGoal.id ,goalData.frQuestions[i], 1, ""]);
      }
    }
    if (goalData.likertQuestions != null) {
      for (var i=0; i<goalData.likertQuestions.length; i++) {
        var choices = goalData.likertQuestions[i][1] + "," + goalData.likertQuestions[i][2];
        await mysql.connect.execute("INSERT INTO questions(goal_id, title, type, qs) VALUES(?, ?, ?, ?);", [currGoal.id ,goalData.likertQuestions[i][0], 2, choices]);
      }
    }
  },

  viewGoalExecutive: async function(goalData, currExecutive) {
    console.log("====in viewGoalExecutive====")
    const [rows, fields] = await mysql.connect.execute("SELECT * FROM goals WHERE title = ? AND executive_id = ?", [goalData.goalTitle, currExecutive.executive_id]);
    if (rows != null){
      const currGoalArray = rows.map(x => new Goal.Goal(x));
      const currGoal = currGoalArray[0];
      var getStatement = "SELECT * FROM questions WHERE goal_id = IFNULL(" + currGoal.id + ", goal_id)";
      const [questionRows, questionFields] = await mysql.connect.execute(getStatement);
      const currQuestionArray = questionRows.map(x => new Question.Question(x));
      currGoal.goal_questions = currQuestionArray;
      return currGoal;
    }

    else{
      return null;
    }
  },

  getGoalWithId: async function(goal_id) {
    const [rows, fields] = await mysql.connect.execute("SELECT * from goals WHERE goal_id = ?", [goal_id]);
    if (rows != null) {
      const goalArray = rows.map(x => new Goal.Goal(x));
      const currGoal = goalArray[0];
      var [questions, qFields] = await mysql.connect.execute("SELECT * FROM questions WHERE goal_id = ?", [goal_id]);
      const questionsArray = questions.map(x => new Question.Question(x));
      currGoal.goal_questions = questionsArray;
      const [responses, rFields] = await mysql.connect.execute("SELECT * FROM responses WHERE goal_id = ? ORDER BY response_date, question_id", [goal_id]);
      const q_responseArray = responses.map(x => new QResponse.QResponse(x));
      var responses_array = [];
      if (q_responseArray.length != 0) {
        responses_array.push(new Response.Response());
        responses_array[0].answers_array.push(q_responseArray[0]);
        responses_array[0].date = q_responseArray[0].date;
        for (var i=1; i<q_responseArray.length; i++) {
            console.log(q_responseArray[i].date);
            console.log(responses_array[responses_array.length - 1].date);
            if (q_responseArray[i].date.getTime() != responses_array[responses_array.length - 1].date.getTime()) {
              responses_array.push(new Response.Response());
              responses_array[responses_array.length - 1].date = q_responseArray[i].date;
            }
            responses_array[responses_array.length - 1].answers_array.push(q_responseArray[i]);
        }
      }
      currGoal.goal_responses =responses_array;
      return currGoal;
    }
    return null;
  }

};
