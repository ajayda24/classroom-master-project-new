const path = require('path');

const express = require('express');
const multer = require('multer')

const studentController = require('../controllers/student');
const studentAuth = require('../middleware/student-auth');

const router = express.Router();

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    studentId = req.session.student._id.toString()
    cb(null, 'studentFiles/' + studentId)
  },
  filename: (req, file, cb) => {
    cb(
      null,
        new Date().getTime() +
        '-' +
        file.originalname
    )
  },
})

router.use(multer({ storage: fileStorage }).single('files'))

// /student/index => GET
router.get('/',studentAuth, studentController.getIndex);

// /student/task => GET
router.get('/task',studentAuth, studentController.getTask);

// /student/attendance => GET
router.get('/attendance',studentAuth, studentController.getAttendance);

// /student/assignments => GET
router.get('/assignments',studentAuth, studentController.getAssignments);

// /student/assignments/add => POST
router.post(
  '/assignments/add',
  studentAuth,
  studentController.postAddAssignments
)

// /student/assignments/details => GET
router.get(
  '/assignments/details/:assignmentId',
  studentAuth,
  studentController.getAssignmentsDetails
)

router.get(
  '/assignments/personal/details/:assignmentId',
  studentAuth,
  studentController.getStudentAssignmentsDetails
)

// /student/assignments/delete => POST
router.post(
  '/assignments/delete',
  studentAuth,
  studentController.postDeleteAssignments
)

// /student/announcements => GET
router.get('/announcements',studentAuth, studentController.getAnnouncements);

// /student/announcements/details => GET
router.get(
  '/announcements/details/:announcementId',
  studentAuth,
  studentController.getAnnouncementsDetails
)

// /student/notes => GET
router.get('/notes',studentAuth, studentController.getNotes);

// /student/notes/details => GET
router.get(
  '/notes/details/:notesId',
  studentAuth,
  studentController.getNotesDetails
)

// /student/profile => GET
router.get('/profile',studentAuth, studentController.getProfile);

// /tutor/chat => GET
router.get('/chat', studentAuth, studentController.getChat)

// /tutor/chat/add => POST
router.post('/chat/add', studentAuth, studentController.postChatAdd)

// /student/login => GET
router.get('/login', studentController.getLogin);

// /student/signup => GET
router.get('/signup', studentController.getSignup);

// /student/login => POST
router.post('/login', studentController.postLogin);

// /student/signup => POST
router.post('/signup', studentController.postSignup);

// /student/login/otp => GET
router.get('/login/otp', studentController.getOtpLogin)

// /student/login/otp/send => POST
router.post('/login/otp/send', studentController.postSendOtp)

// /student/login/otp/verify => POST
router.post('/login/otp/verify', studentController.postOtpVerify)

// /student/logout => POST
router.post('/logout', studentController.postLogout);


module.exports = router;