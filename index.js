const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const app = express();
const ObjectId = require('mongodb').ObjectId;
require('dotenv').config();
const admin = require("firebase-admin");
const fileUpload = require('express-fileupload');
const SSLCommerzPayment = require('sslcommerz'); 
const { v4: uuidv4 } = require('uuid');
const port = process.env.PORT || 5000;

//middleware 
app.use(cors()); 
app.use(express.json({limit: '50mb'}));
app.use(fileUpload());
app.use(express.urlencoded({limit: '50mb'}));

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
        const StudentNoticeCollection = database.collection('StudentNoticeCollection');
        const FeeCollection = database.collection('FeeCollection');
        const PaymentCollection = database.collection('PaymentCollection');
        const AnouncementCollection = database.collection('AnouncementCollection');
        const ExamRoutineCollection = database.collection('ExamRoutineCollection');
        const ManualClassRoutineCollection = database.collection('ManualClassRoutineCollection');
        const AddmissionFormCollection = database.collection('AddmissionFormCollection')
        const SessionFeeCollection = database.collection('SessionFeeCollection')

        
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

            if(user.role)  
            {
                res.send({userrole: user.role})
            }
            else{
                res.send({none: 'norole'})
            }
        })

        //finding section and class for teacher
        app.get('/teachersection', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await UserCollection.findOne(query);
            
            if(user?.teachersection)
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
                    title: data.title,
                    description: data.description
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
            const section = req.query.section;
            const studentclass = req.query.class;
            const query = {studentclass: studentclass, studentsection: section}
            const result = await StudentNoticeCollection.find(query).toArray()
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
                    title: data.title,
                    description: data.description
                }
            }
            const result = await StudentNoticeCollection.updateOne(filter, updatedoc, option);
            res.send(result)
        }) 

        //principal getting all teacher info
        app.get('/getteacher', async (req, res) => {
            const query = {role: "Teacher"};
            const result = await UserCollection.find(query).toArray();
            res.send(result)
        })
        
        //principal posting payment
        app.post('/postpayment', async(req, res) =>{
            const data = req.body;
            const result = await FeeCollection.insertMany(data);
            res.json(result)
        })
        //principal geting all student 
        app.get('/getallstudent', async (req, res) => {
            const query = {role: 'Student'};
            const result = await UserCollection.find(query).toArray()
            res.send(result) 
        })
        //principal getting student by their class to check payment 
        app.get('/checkstudentpayments', async (req, res) => {
            const studentclass = req.query.class;
            const query = {studentclass: studentclass};
            const result = await UserCollection.find(query).toArray();
            res.send(result)
        })
        //principal geting individual result of student
        app.get('/individualpaymentcheck/:id', async(req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const student = await UserCollection.findOne(query);
           
            if(student.studentname)
            {
                const query2 = {studentclass: student.studentclass, studentroll: student.studentroll, studentname: student.studentname};
                const result = await FeeCollection.find(query2).toArray();
                res.send(result)
            } 
            else{
                res.send('wrong')
            }
        })
        

         //principal posting anouncement 
         app.post('/publishanouncement', async (req, res) => {
            const notice = req.body;
            const result = await AnouncementCollection.insertOne(notice);
            res.json(result)
        })

        //principal geting anouncement for managing
        app.get('/getAnouncement', async(req,res) => {
            const cursor = AnouncementCollection.find({});
            const result = await cursor.toArray();
            res.send(result)
        })

        //principal deleting anouncement 
        app.delete('/anouncementdelete/:id', async (req, res) =>{
            const id = req.params.id;

            const query = {_id: ObjectId(id)};
            const result = await AnouncementCollection.deleteOne(query);
            res.send(result)
        })

        //principal geting specific anouncement for editing
        app.get('/getEditAnouncement/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await AnouncementCollection.findOne(query);
            res.send(result)
        })

        //principal puting  edited anouncement 
        app.put('/putEditedAnouncement/:id', async (req, res) => {
            const id = req.params.id;
            const data = req.body;
            const filter = {_id: ObjectId(id)};
            const option = {upsert: true};
            const updatedoc = {
                $set: {
                    title: data.title,
                    description: data.description
                }
            }
            const result = await AnouncementCollection.updateOne(filter, updatedoc, option);
            res.send(result)
        })

        //teacher deleting class routine
        app.delete('/deleteclassroutine/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await ClassRoutineCollection.deleteOne(query)
            res.send(result)
        })
        //adding exam routine
        app.post('/addexamroutine', async (req, res) => {
            const data = req.files.img.data;
            const encodedpic1 = data.toString('base64');
            const img = Buffer.from(encodedpic1, 'base64');
      
            const routine = {img:img}
            const result = await ExamRoutineCollection.insertOne(routine)
            res.json(result) 
        }) 
        //teacher deleting exam routine
        app.delete('/deleteExamRoutine/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await ExamRoutineCollection.deleteOne(query)
            res.send(result)
        })
        //teacher posting manual routine
        app.post('/addManualRoutine', async (req, res) => {
            const data = req.body
            const result = await ManualClassRoutineCollection.insertOne(data);
            res.json(result)
        })
        //principal geting all addmission form
        app.get('/getallAddmissionForm', async (req, res) => {
            const cursor = AddmissionFormCollection.find({})
            const result = await cursor.toArray()
            res.send(result)
        })
         //principal geting all addmission form
         app.get('/getIndividualAddmissionForm/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: ObjectId(id)}
            const result = await AddmissionFormCollection.findOne(query)
            res.send(result)
        })
        //Principal posting session fee
        app.post('/postSessionFee', async (req, res) => {
            const data = req.body
            const result = await SessionFeeCollection.insertOne(data);
            res.json(result)
        })
// ----------------END Teacher---------------//

//----------------for stduent----------//

        //finding student individual sec and class
        app.get('/studentsection', async (req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const user = await UserCollection.findOne(query)
           
            if(user?.studentclass){
    
                res.send({studentclass: user.studentclass, studentsection: user.studentsection})
            }
            else{
                res.send('hi')
            }
        })

          //finding result of first term for individual stduent
          app.get('/result', async (req, res) => {
            const email = req.query.email;
            const term = String(req.query.term);
            const queryone = {email: email}
            const student = await UserCollection.findOne(queryone);

               if(student && term)
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

            if(student?.email)
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
         //geting class routine 
         app.get('/getExamroutine', async (req,res) => {
            const cursor = ExamRoutineCollection.find({})
            const result = await cursor.toArray();
            res.send(result)
        })

        //student get info of fees
        app.get('/getfees', async(req, res) => {
            const email = req.query.email;
            const query = {email: email};
            const result = await FeeCollection.find(query).toArray();
            res.send(result)
        })
        //student geting manual routine
        app.get('/getManualClassRoutine', async (req, res) => {
            const section = req.query.section
            const routineClass = req.query.routineClass
            const query = {routineclass: routineClass, routinesection: section}
            const result = await ManualClassRoutineCollection.findOne(query)
            res.send(result)
        })
// -------------Bikash Payment system implement-----------//
        app.get('/getpaymentmonth/:id', async (req, res) => {
            const id = req.params.id;

            const query = {_id: ObjectId(id)};
            const result = await FeeCollection.findOne(query);
            res.send(result)
        })
        app.get('/getSessionfees', async (req, res) => {
            const email = req.query.email
            const query = {email: email}
            const result = await SessionFeeCollection.findOne(query)
            res.send(result)
        })
        app.post('/init', async (req, res) => {
            const id = req.body.id
            const productInfo = {
                total_amount: req.body.total_amount,
                currency: 'BDT',
                tran_id: uuidv4(),
                success_url: 'http://localhost:5000/success',
                fail_url: 'http://localhost:5000/failure',
                cancel_url: 'http://localhost:5000/cancel',
                ipn_url: 'http://localhost:5000/ipn',
                paymentStatus: 'pending',
                shipping_method: 'Courier',
                product_name:'ahan',
                product_category: 'Electronic',
                product_profile: 'shool',
                product_image:'ahan',
                cus_name:'ahan',
                cus_email: req.body.cus_email,
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name:'ahan',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
                multi_card_name: 'mastercard',
                value_a: 'ref001_A',
                value_b: 'ref002_B',
                value_c: 'ref003_C',
                value_d: 'ref004_D'
            };
 

            const sslcommer = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWORD, false) 
            sslcommer.init(productInfo).then(data => {
    
                //process the response that got from sslcommerz 
                //https://developer.sslcommerz.com/doc/v4/#returned-parameters
    
                const info = { ...productInfo, ...data }
                console.log(info)
                if (info.GatewayPageURL) {
                    res.json(info.GatewayPageURL)
                 }
                else {
                    return res.status(400).json({
                        message: "SSL session was not successful"
                    })
                }
     
            }); 
    
            app.post("/success", async (req, res) => {
                const filter = {_id: ObjectId(id)}
                const option = {upsert: true};
          
                const updatedoc ={
                    $set:{
                        paymentStatus: 'PAID',
                        tran_id: uuidv4()
                    }
                }
                const result = await FeeCollection.updateOne(filter, updatedoc, option)
               res.status(200).redirect(`http://localhost:3000/studentdashboard/success`)
               
            })
    
            app.post("/failure", async (req, res) => {
    
                res.status(400).redirect('http://localhost:3000/studentdashboard/studentpayment')
         
             })
             app.post("/cancel", async (req, res) => {
    
                res.status(400).redirect('http://localhost:3000/studentdashboard/studentpayment')
         
             })
    
             app.get('/payment/:tran_id', async (req, res) => {
        
                const id = req.params.tran_id;
                const result = await PaymentCollection.findOne({ tran_id: id })
                res.json(result)
            })
    
           
        });
 
        app.post('/addmissionpayment', async (req, res) => {
            const datas = req.body
            const front = req.files.img.data;
             
            const encodedpic = front.toString('base64');
            const img = Buffer.from(encodedpic, 'base64');
            const admissiondata = {...datas, img}

            const productInfo = {
                total_amount: req.body.totalAmount,
                currency: 'BDT',
                tran_id: uuidv4(),
                success_url: 'http://localhost:5000/successes',
                fail_url: 'http://localhost:5000/failures',
                cancel_url: 'http://localhost:5000/canceled',
                ipn_url: 'http://localhost:5000/ipn',
                paymentStatus: 'success',
                shipping_method: 'Courier',
                product_name:'ahan',
                product_category: 'Electronic',
                product_profile: 'shool',
                product_image:'ahan',
                cus_name:'ahan',
                cus_email: 'ahan@gmail.com',
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name:'ahan',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
                multi_card_name: 'mastercard',
                value_a: 'ref001_A',
                value_b: 'ref002_B',
                value_c: 'ref003_C',
                value_d: 'ref004_D'
            };
 
            const sslcommer = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWORD, false) 
            sslcommer.init(productInfo).then(data => {
    
                const info = { ...productInfo, ...data }
                
                if (info.GatewayPageURL) {
                    res.json(info.GatewayPageURL)
                 }
                else {
                    return res.status(400).json({
                        message: "SSL session was not successful"
                    })
                }
     
            }); 
    
            app.post("/successes", async (req, res) => {
                const result = await AddmissionFormCollection.insertOne(admissiondata)
               res.status(200).redirect(`http://localhost:3000/AddmissionSuccess`)
               
            }) 
    
            app.post("/failures", async (req, res) => {
    
                res.status(400).redirect('http://localhost:3000')
         
             })
             app.post("/canceled", async (req, res) => {
    
                res.status(400).redirect('http://localhost:3000')
         
             })
    
             app.get('/payment/:tran_id', async (req, res) => {
        
                const id = req.params.tran_id;
                const result = await PaymentCollection.findOne({ tran_id: id })
                res.json(result)
            })
    
        });
        app.post('/sessionFee', async (req, res) => {
            const id = req.body.id
            const productInfo = {
                total_amount: req.body.total_amount,
                currency: 'BDT',
                tran_id: uuidv4(),
                success_url: 'http://localhost:5000/success',
                fail_url: 'http://localhost:5000/failure',
                cancel_url: 'http://localhost:5000/cancel',
                ipn_url: 'http://localhost:5000/ipn',
                paymentStatus: 'pending',
                shipping_method: 'Courier',
                product_name:'ahan',
                product_category: 'Electronic',
                product_profile: 'shool',
                product_image:'ahan',
                cus_name:'ahan',
                cus_email: req.body.cus_email,
                cus_add1: 'Dhaka',
                cus_add2: 'Dhaka',
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name:'ahan',
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',
                multi_card_name: 'mastercard',
                value_a: 'ref001_A',
                value_b: 'ref002_B',
                value_c: 'ref003_C',
                value_d: 'ref004_D'
            };
 

            const sslcommer = new SSLCommerzPayment(process.env.STORE_ID, process.env.STORE_PASSWORD, false) 
            sslcommer.init(productInfo).then(data => {
    
                //process the response that got from sslcommerz 
                //https://developer.sslcommerz.com/doc/v4/#returned-parameters
    
                const info = { ...productInfo, ...data }
                console.log(info)
                if (info.GatewayPageURL) {
                    res.json(info.GatewayPageURL)
                 }
                else {
                    return res.status(400).json({
                        message: "SSL session was not successful"
                    })
                }
     
            }); 
    
            app.post("/success", async (req, res) => {
                const filter = {_id: ObjectId(id)}
                const option = {upsert: true};
          
                const updatedoc ={
                    $set:{
                        paymentStatus: 'PAID',
                        tran_id: uuidv4()
                    }
                }
                const result = await SessionFeeCollection.updateOne(filter, updatedoc, option)
               res.status(200).redirect(`http://localhost:3000/studentdashboard/success`)
               
            })
    
            app.post("/failure", async (req, res) => {
    
                res.status(400).redirect('http://localhost:3000/studentdashboard/studentpayment')
         
             })
             app.post("/cancel", async (req, res) => {
    
                res.status(400).redirect('http://localhost:3000/studentdashboard/studentpayment')
         
             })
    
             app.get('/payment/:tran_id', async (req, res) => {
        
                const id = req.params.tran_id;
                const result = await PaymentCollection.findOne({ tran_id: id })
                res.json(result)
            })
    
           
        });
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