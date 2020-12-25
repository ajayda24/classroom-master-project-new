const path = require('path')
const fs = require('fs')

const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoDBStore = require('connect-mongodb-session')(session)


const errorController = require('./controllers/error')
const indexController = require('./controllers/index')
const Tutor = require('./models/tutor')
const Student = require('./models/student')

const MONGODB_URI = 'mongodb+srv://ajayda24:yaja110125@cluster0.l53kc.mongodb.net/classroomDB'
// const MONGODB_URI = 'mongodb://localhost:27017/node-master-classroom'

const app = express()
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions',
})

require('dotenv').config()

app.set('view engine', 'ejs')
app.set('views', 'views')

const studentRoutes = require('./routes/student')
const tutorRoutes = require('./routes/tutor')

app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store,
  })
)

// const fileStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     tutorId = req.session.tutor._id.toString()
//     cb(null, 'tutorFiles/'+tutorId)
//   },
//   filename: (req, file, cb) => {
//     cb(
//       null,
//         new Date().getTime() +
//         '-' +
//         file.originalname
//     )
//   },
// })

app.use(bodyParser.urlencoded({ extended: false }))
// app.use(multer({ storage: fileStorage }).single('files'))

app.use(express.static(path.join(__dirname, 'public')))
app.use('/tutorFiles', express.static(path.join(__dirname, 'tutorFiles')))
app.use('/studentFiles', express.static(path.join(__dirname, 'studentFiles')))

app.use((req, res, next) => {
  if (!req.session.tutor) {
    return next()
  }

  Tutor.findById(req.session.tutor._id)
    .then((tutor) => {
      req.tutor = tutor
      next()
    })
    .catch((err) => console.log(err))
})

app.use((req, res, next) => {
  if (!req.session.student) {
    return next()
  }
  Student.findById(req.session.student._id)
    .then((student) => {
      req.student = student
      next()
    })
    .catch((err) => console.log(err))
})

// app.use('/admin', adminRoutes);

app.use('/tutor', tutorRoutes)
app.use('/student', studentRoutes)
app.get('/', indexController.getIndex)
app.use(errorController.get404)

let port = process.env.PORT
if (port == null || port == '') {
  port = 3000
}

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then((result) => {
    const server = app.listen(port)
    const io = require('./socket').init(server)
    io.on('connection', (socket) => {
      console.log('Client Connected');
    })
  })
  .catch((err) => {
    console.log(err)
  })
