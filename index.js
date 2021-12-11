const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const admin = require("firebase-admin");
const fileUpload = require('express-fileupload');
const port = process.env.PORT || 5000;

//middleware 
app.use(cors());
app.use(express.json());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.obwta.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try{  
        await client.connect();

        const database = client.db('SchoolDB');
        const UserCollection = database.collection('UserCollection');
        const ResultCollection = database.collection('ResultCollection');
        const ClassRoutineCollection = database.collection('ClassRoutineCollection');
        const TeacherNoticeCollection = database.collection('TeacherNoticeCollection');
        const StudentNoticeCollection = database.collection('StudentNoticeCollection')
// ----------for all teacher -----------//

        //adding user to database
        app.post('/useradd', async (req, res) => {
            const data = req.body;
            const result = await UserCollection.insertOne(data);
            res.json(result)
        })

        // checking user role
        app.get('/checkuser', async (req, res) => {
 
            const email = req.query.email;
            const query = {email: email};
            const user = await UserCollection.findOne(query);
            res.send({userrole: user.role})
        })

        //finding section and class for teacher
        app.get('/teachersection', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await UserCollection.findOne(query);
            
            if(user.teachersection)
            {
                res.send({section: user.teachersection, classteacher: user.teacherclass})
            }
            else{
                res.send('hi')
            }
            
        })

        //finding individual students from  class and section
        app.get('/maintainstudent', async(req, res) => {
            const section = req.query.section;
            const studentclass = req.query.class;
        
            const query = {studentsection: section, studentclass: studentclass}
            const students = await UserCollection.find(query).toArray()
           
            res.send(students)
        })

        //adding result to database
        app.post('/resultinsert', async(req, res) => {
            const result = req.body;
            const studentresult = await ResultCollection.insertOne(result)
            res.json(studentresult)
        })

        //geting individual students performance 
        app.get('/getindividualresult/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const student = await UserCollection.findOne(filter)

            if(student.studentname)
            {
                const query2 = {studentname: student.studentname, studentroll: student.studentroll, class: student.studentclass}
                const result = await ResultCollection.find(query2).toArray();
                
                res.send(result)
            }
            else
            {
                res.send('Hi')
            }
        })

        //getting individual term result for editing
        app.get('/resultedit/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await ResultCollection.findOne(filter);
            res.send(result)
        })

        //putinng edited result 
        app.put('/postingeditresult', async (req, res) => {
            const id = req.query.id;
            const data = req.body
            const filter = {_id: ObjectId(id)}
            const option = {upsert: true};
            const updateddoc = {
                $set: data
            };
            const result = await ResultCollection.updateOne(filter, updateddoc, option);
            res.json(result)
        })

        //adding class routine
        app.post('/addclassroutine', async (req, res) => {
            const data = req.files.img.data;

            const encodedpic1 = data.toString('base64');
            const img = Buffer.from(encodedpic1, 'base64');
      
            const routine = {img:img}
            const result = await ClassRoutineCollection.insertOne(routine)
            res.json(result) 
        })
        //principal posting notice 
        app.post('/principalnotice', async (req, res) => {
            const notice = req.body;
            const result = await TeacherNoticeCollection.insertOne(notice);
            res.json(result)
        })

        //principal geting teacher notice for managing
        app.get('/gettechernotice', async(req,res) => {
            const cursor = TeacherNoticeCollection.find({});
            const result = await cursor.toArray();
            res.send(result)
        })

        //principal deleting notice 
        app.delete('/teacherdeletenotice/:id', async (req, res) =>{
            const id = req.params.id;

            const query = {_id: ObjectId(id)};
            const result = await TeacherNoticeCollection.deleteOne(query);
            res.send(result)
        })

        //principal geting specific notice for editing
        app.get('/geteditnotice/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await TeacherNoticeCollection.findOne(query);
            res.send(result)
        })

        //principal puting  teachers edited notice 
        app.put('/puteditednotice/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = {_id: ObjectId(id)};
            const option = {upsert: true};
            const updatedoc = {
                $set: {
                    teachernotice: data.teachernotice
                }
            }
            const result = await TeacherNoticeCollection.updateOne(filter, updatedoc, option);
            res.send(result)
        })


        //teacher publishing notice for student 
        app.post('/studentnotice', async (req, res) => {
            const data = req.body;
            const result = await StudentNoticeCollection.insertOne(data);
            res.json(result)
        })

        //teacher geting student notice for managing
        app.get('/getstudentnotice', async(req,res) => {
            const cursor = StudentNoticeCollection.find({});
            const result = await cursor.toArray();
            res.send(result)
        })

        //teacher deleting notice 
        app.delete('/studentdeletenotice/:id', async (req, res) =>{
            const id = req.params.id;

            const query = {_id: ObjectId(id)};
            const result = await StudentNoticeCollection.deleteOne(query);
            res.send(result)
        })

        //Teacher geting specific notice for editing
        app.get('/getstudenteditnotice/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await StudentNoticeCollection.findOne(query);
            res.send(result)
        })

        //teacher puting  student edited notice 
        app.put('/putstudenteditnotice/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = {_id: ObjectId(id)};
            const option = {upsert: true};
            const updatedoc = {
                $set: {
                    studentnotice: data.studentnotice
                }
            }
            const result = await StudentNoticeCollection.updateOne(filter, updatedoc, option);
            res.send(result)
        })
        
// ----------------END Teacher---------------//

//----------------for stduent----------//

        //finding student individual sec and class
        app.get('/studentsection', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await UserCollection.findOne(query)
            res.send({studentclass: user.studentclass, studentsection: user.studentsection})
        })

          //finding result of first term for individual stduent
          app.get('/result', async (req, res) => {
            const email = req.query.email;
            const term = String(req.query.term);
            const queryone = {email: email}
            const student = await UserCollection.findOne(queryone);

               if(student.email && term)
               {
               
                const querytwo = {term: term,studentname: student.studentname, studentroll: student.studentroll, class: student.studentclass}

                const result = await ResultCollection.findOne(querytwo);
                
                res.send(result)
               }
               else{
                   res.status(401)
               }
        })


        //geting transcript data
        app.get('/transcriptget', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
           
            const student = await UserCollection.findOne(query)
            if(student.email)
            {
                const query2 = {studentname: student.studentname, studentroll: student.studentroll, class: student.studentclass, section: student.studentsection}
                const result = await ResultCollection.find(query2).toArray();
                res.send(result) 
            }
            else{
                res.send('Hi')
            }
            
        })
          
        //geting details for transcript
        app.get('/gettransdetails', async (req, res) => {
            const email = req.query.email;
            if(email)
            {
                const query = {email: email};
                const result = await UserCollection.findOne(query);
                res.send(result)
            }
            else{
                res.send('hi')
            }
        })

        //geting class routine 
        app.get('/getclassroutine', async (req,res) => {
            const cursor = ClassRoutineCollection.find({})
            const result = await cursor.toArray();
            res.send(result)
        })

        //----------------END stduent----------//

    }
    finally{

    }
}
run().catch(console.dir)


app.get('/',  (req, res) => {
    res.send('Final Project Server is Connected')
})

app.listen(port, (req, res) => {
    console.log('Server Port is', port)
})