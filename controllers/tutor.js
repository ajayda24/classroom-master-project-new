const fs = require('fs')
const path = require('path')

const deletFiles = require('../util/deleteFiles')
const io = require('../socket')

const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
var unirest = require('unirest')
var canvas = require('canvas')
var Clipper = require('image-clipper')

const Tutor = require('../models/tutor')
const Student = require('../models/student')
const tutor = require('../models/tutor')

exports.getIndex = (req, res, next) => {
  const tutorId = req.session.tutor._id.toString()
  const folderName = 'tutorFiles/' + tutorId
  try {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }
  } catch (err) {
    console.error(err)
  }

  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    const lastAnn = tutor.announcements.slice(
      Math.max(tutor.announcements.length - 5, 0)
    )
    const lastAnnSort = lastAnn.reverse();
    const lastevents = tutor.events.slice(Math.max(tutor.events.length - 5, 0));
    const lastEventsSort = lastevents.reverse();

    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments)
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

        

      res.render('tutor/index', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        announcements: lastAnnSort,
        events: lastEventsSort,
        notifyAssignments: studentAssignments,
      })
    })
  })
}

exports.getProfile = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    res.render('tutor/profile', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/profile',
      tutorId: tutor._id,
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      job: tutor.job,
      tClass: tutor.tClass,
      division: tutor.tDivision,
      tEmail: tutor.tEmail,
      address: tutor.address,
      mobile: tutor.mobile,
      photo: tutor.photo,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.getEditProfile = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    const editMode = req.query.edit
    if (!editMode) {
      return res.redirect('/')
    }
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    const tutorId = req.params.tutorId
    Tutor.findById(tutorId)
      .then((tutor) => {
        if (!tutor) {
          return res.redirect('/tutor')
        }
        res.render('tutor/profile-edit', {
          pageTitle: 'Edit Profile',
          path: '/tutor',
          sPath: '/tutor/profile',
          name: tutor.name,
          editing: editMode,
          isAuthenticated: req.session.isTutorLoggedIn,
          tutor: tutor,
          notifyAssignments: studentAssignments,
        })
      })
      .catch((err) => console.log(err))
  })
})
}

exports.postEditProfile = (req, res, next) => {
  const tutorId = req.body.tutorId

  const updatedName = req.body.inputName
  const updatedEmail = req.body.inputEmail
  const updatedClass = req.body.inputClass
  const updatedDivision = req.body.inputDivision
  const updatedMobile = req.body.inputMobile
  const updatedAddress = req.body.inputAddress

  const file = req.file
  if (file) {
    var fileUrl = file.path
    var fileType = file.mimetype
  }

  Tutor.findById(tutorId)
    .then((profile) => {
      profile.name = updatedName
      profile.tEmail = updatedEmail
      profile.tClass = updatedClass
      profile.tDivision = updatedDivision
      profile.mobile = updatedMobile
      profile.address = updatedAddress

      if (file) {
        if (!profile.photo == '') {
          deletFiles.deleteFile(profile.photo)
        }
        profile.photo = fileUrl
      }
      return profile.save()
    })
    .then((result) => {
      console.log('UPDATED PROFILE!')
      res.redirect('/tutor/profile')
    })
    .catch((err) => console.log(err))
}

exports.getStudents = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
      res.render('tutor/students', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor/students',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        students: students,
        notifyAssignments: studentAssignments,
      })
    })
  })
}

exports.getDetailsStudent = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    const studentId = req.params.studentId
    Student.findById(studentId).then((student) => {
      res.render('tutor/student-details', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor/students',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        student: student,
        assignments: student.assignments,
        notifyAssignments: studentAssignments,
      })
    })
  })
})
}

exports.getAddStudents = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    res.render('tutor/students-add', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/students',
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      tutor: tutor,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.postAddStudents = (req, res, next) => {
  const addedName = req.body.inputName
  const addedEmail = req.body.inputEmail
  const addedPassword = req.body.inputPassword
  const addedClass = req.body.inputClass
  const addedDivision = req.body.inputDivision
  const addedRollNo = req.body.inputRollNo
  const addedMobile = req.body.inputMobile
  const addedAddress = req.body.inputAddress

  const sampleImage = req.body.sampleImage
  const file = req.file
  if (file) {
    fileUrl = file.path
  } else {
    fileUrl = sampleImage
  }

  bcrypt.hash(addedPassword, 12).then((hashedPassword) => {
    const newStudent = new Student({
      email: addedEmail,
      password: hashedPassword,
      name: addedName,
      sId: addedRollNo,
      tutorId: req.session.tutor._id,
      sClass: addedClass,
      sDivision: addedDivision,
      mobile: addedMobile,
      address: addedAddress,
      photo: fileUrl,
    })
    newStudent
      .save()
      .then((result) => {
        // console.log(result);
        console.log('Added New Student')
        res.redirect('/tutor/students')
      })
      .catch((err) => {
        console.log(err)
      })
  })
}

exports.getEditStudent = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    const editMode = req.query.edit
    if (!editMode) {
      return res.redirect('/')
    }
    const studentId = req.params.studentId
    Student.findById(studentId)
      .then((student) => {
        if (!student) {
          return res.redirect('/tutor/students')
        }
        res.render('tutor/student-edit', {
          pageTitle: 'Edit Student',
          path: '/tutor',
          sPath: '/tutor/students',
          name: tutor.name,
          editing: editMode,
          isAuthenticated: req.session.isTutorLoggedIn,
          tutor: tutor,
          student: student,
          notifyAssignments: studentAssignments,
        })
      })
      .catch((err) => console.log(err))
  })
})
}

exports.postEditStudents = (req, res, next) => {
  const studentId = req.body.studentId

  const updatedName = req.body.inputName
  const updatedEmail = req.body.inputEmail
  const updatedPassword = req.body.inputPassword
  const updatedClass = req.body.inputClass
  const updatedDivision = req.body.inputDivision
  const updatedRollNo = req.body.inputRollNo
  const updatedMobile = req.body.inputMobile
  const updatedAddress = req.body.inputAddress
  const file = req.file
  if (file) {
    var fileUrl = file.path
  }

  Student.findById(studentId).then((details) => {
    if (!updatedPassword == '') {
      bcrypt.hash(updatedPassword, 12).then((hashedPassword) => {
        details.email = updatedEmail
        details.password = hashedPassword
        details.name = updatedName
        details.sId = updatedRollNo
        details.tutorId = req.session.tutor._id
        details.sClass = updatedClass
        details.sDivision = updatedDivision
        details.mobile = updatedMobile
        details.address = updatedAddress
        if (file) {
          details.photo = fileUrl
        }
        details
          .save()
          .then((result) => {
            // console.log(result);
            console.log('Edited a Student')
            res.redirect('/tutor/students')
          })
          .catch((err) => {
            console.log(err)
          })
      })
    } else {
      details.email = updatedEmail
      details.name = updatedName
      details.sId = updatedRollNo
      details.tutorId = req.session.tutor._id
      details.sClass = updatedClass
      details.sDivision = updatedDivision
      details.mobile = updatedMobile
      details.address = updatedAddress
      if (file) {
        details.photo = fileUrl
      }
      details
        .save()
        .then((result) => {
          // console.log(result);
          console.log('Edited a Student')
          res.redirect('/tutor/students')
        })
        .catch((err) => {
          console.log(err)
        })
    }
  })
}

exports.postDeleteStudents = (req, res, next) => {
  const studentId = req.body.studentId
  Student.findById(studentId)
    .then((student) => {
      if (
        student.photo !=
        'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcREXkCmHkZReqX244oe5PqHs7Xx87MdHEbbfA&usqp=CAU'
      ) {
        deletFiles.deleteFile(student.photo)
      }
    })
    .catch((err) => {
      console.log(err)
    })
  Student.findByIdAndRemove(studentId)
    .then(() => {
      res.redirect('/tutor/students')
    })
    .catch((err) => console.log(err))
}

exports.getAttendance = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var today = new Date().toLocaleDateString()
      var date = new Date(today)
      var dd = String(date.getDate()).padStart(2, '0')
      var mm = String(date.getMonth() + 1).padStart(2, '0') //January is 0!
      var yyyy = date.getFullYear()

      today = yyyy + '-' + mm + '-' + dd

      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      

      res.render('tutor/attendance', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor/attendance',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        students: students,
        initialDate: today,
        notifyAssignments: studentAssignments,
      })
    })
  })
}

exports.postSearchAttendance = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
      var searchDate = req.body.date
      res.render('tutor/attendance', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor/attendance',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        students: students,
        initialDate: searchDate,
        notifyAssignments: studentAssignments,
      })
    })
  })
}

exports.getSingleStudentAttendance = (req, res, next) => {
  const studentId = req.params.studentId
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    Student.findById({ _id: studentId }, function (err, student) {
      res.render('tutor/attendance-single', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor/attendance',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        attendance: student.attendance,
        student: student,
        notifyAssignments: studentAssignments,
      })
    })
  })
})
}

exports.getAssignments = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    res.render('tutor/assignments', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/assignments',
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      assignments: tutor.assignments,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.postAddAssignments = (req, res, next) => {
  const tutorId = req.session.tutor._id
  const topic = req.body.inputTopic
  const questions = req.body.inputQuestions
  const file = req.file
  if (file) {
    var fileUrl = file.path
    var fileType = file.mimetype
  }

  const date = new Date().toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  Tutor.findOne({ _id: req.session.tutor._id })
    .then((tutor) => {
      var addAssignments = {}
      if (file) {
        addAssignments = {
          topic: topic,
          content: questions,
          date: date,
          file: fileUrl,
          filetype: fileType,
          tutorId: tutorId,
          item: 'Assignment'
        }
      } else {
        addAssignments = {
          topic: topic,
          content: questions,
          date: date,
          file: fileUrl,
          filetype: fileType,
          tutorId: tutorId,
          item: 'Assignment',
        }
      }
      
      tutor.assignments.push(addAssignments)
      return tutor.save()
    })
    .then((tutor) => {
      io.getIO().emit('notifications', {
        action: 'assignment-adding',
        data: tutor.assignments,
      })
      res.redirect('/tutor/assignments')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getAssignmentsDetails = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    const studentId = req.params.studentId
    if (studentId) {
      Student.findOne({ _id: studentId }, function (err, student) {
        const assignmentId = req.params.assignmentId
        const studentAssignment = student.assignments.find(
          ({ _id }) => _id == assignmentId
        )

        if (studentAssignment.filetype == 'application/pdf') {
          const assignmentRead = studentAssignment.file
          const file = fs.createReadStream(assignmentRead)
          res.setHeader('Content-Type', 'application/pdf')
          file.pipe(res)
        } else {
          res.render('tutor/assignments-details', {
            pageTitle: 'Dashboard',
            path: '/tutor',
            sPath: '/tutor/assignments',
            name: tutor.name,
            editing: false,
            isAuthenticated: req.session.isTutorLoggedIn,
            assignment: studentAssignment,
            notifyAssignments: studentAssignments,
          })
        }
      })
    } else {
      const assignmentId = req.params.assignmentId
      const tutorAssignment = tutor.assignments.find(
        ({ _id }) => _id == assignmentId
      )

      if (tutorAssignment.filetype == 'application/pdf') {
        const assignmentRead = tutorAssignment.file
        const file = fs.createReadStream(assignmentRead)
        res.setHeader('Content-Type', 'application/pdf')
        file.pipe(res)
      } else {
        res.render('tutor/assignments-details', {
          pageTitle: 'Dashboard',
          path: '/tutor',
          sPath: '/tutor/assignments',
          name: tutor.name,
          editing: false,
          isAuthenticated: req.session.isTutorLoggedIn,
          assignment: tutorAssignment,
          notifyAssignments: studentAssignments,
        })
      }
    }
  })
})
}

exports.postStudentAssignmentMark = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    var studentId = req.params.studentId
    const assignmentMark = req.body.assignmentMark
    if (studentId) {
      Student.findOne({ _id: studentId }).then((student) => {
        const assignmentId = req.params.assignmentId
        const studentAssignment = student.assignments.find(
          ({ _id }) => _id == assignmentId
        )
        studentAssignment.mark = assignmentMark
        student.save().then((result) => {
          res.redirect('/tutor/students/details/' + studentId)
        })
      })
    }
  })
}

exports.postDeleteAssignments = (req, res, next) => {
  const assignmentId = req.body.assignmentId
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    const assignment = tutor.assignments.find(({ _id }) => _id == assignmentId)
    if (assignment.file) {
      deletFiles.deleteFile(assignment.file)
    }
  })
  Tutor.findByIdAndUpdate(req.session.tutor._id, {
    $pull: { assignments: { _id: assignmentId } },
  })
    .then((tutor) => {
      io.getIO().emit('notifications', {
        action: 'assignment-deleting',
        data: tutor.assignments,
      })
      res.redirect('/tutor/assignments')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getNotes = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    res.render('tutor/notes', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/notes',
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      notes: tutor.notes,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.postAddNotes = (req, res, next) => {
  const tutorId = req.session.tutor._id
  const topic = req.body.inputTopic
  const videoLink = req.body.inputYoutubeLink
  const file = req.file
  if (file) {
    var notesFileUrl = file.path
    var notesFileType = file.mimetype
    var notesFileOriginalName = file.originalname
  }
  if (videoLink) {
    var video_id = videoLink
    var search_v = videoLink.search('v=')
    var searchYoutu = video_id.search('youtu.be')
    if (search_v != -1) {
      video_id = videoLink.split('v=')[1]
      var ampersandPosition = video_id.indexOf('&')
      if (ampersandPosition != -1) {
        video_id = video_id.substring(0, ampersandPosition)
      }
      originalLink = 'https://www.youtube.com/embed/' + video_id
    } else if (searchYoutu != -1) {
      video_id = video_id.substring(17)
      originalLink = 'https://www.youtube.com/embed/' + video_id
    } else {
      originalLink = videoLink
    }
  }
  const date = new Date().toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  Tutor.findOne({ _id: req.session.tutor._id })
    .then((tutor) => {
      var addNotes = {}
      if (file) {
        addNotes = {
          topic: topic,
          date: date,
          file: notesFileUrl,
          filetype: notesFileType,
          filename: notesFileOriginalName,
          tutorId: tutorId,
          item: 'Notes',
        }
      } else if (videoLink) {
        addNotes = {
          topic: topic,
          date: date,
          tutorId: tutorId,
          link: originalLink,
          filename: 'Youtube Video',
          item: 'Notes',
        }
      } else {
        addNotes = {
          topic: topic,
          date: date,
          tutorId: tutorId,
          filename: 'Sample',
          item: 'Notes',
        }
      }

      tutor.notes.push(addNotes)
      return tutor.save()
    })
    .then((tutor) => {
      io.getIO().emit('notifications', {
        action: 'notes-adding',
        data: tutor.notes,
      })
      res.redirect('/tutor/notes')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getNotesDetails = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    const notesId = req.params.notesId
    const note = tutor.notes.find(({ _id }) => _id == notesId)
    if (note.filetype == 'application/pdf') {
      const noteRead = note.file
      const file = fs.createReadStream(noteRead)
      res.setHeader('Content-Type', 'application/pdf')
      file.pipe(res)
    } else if (
      note.filetype == 'video/mp4' ||
      note.filetype == 'video/mkv' ||
      note.filetype == 'video/avi'
    ) {
      res.render('tutor/notes-details', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor/notes',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        note: note,
        video: true,
        notifyAssignments: studentAssignments,
      })
    } else {
      res.render('tutor/notes-details', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor/notes',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        note: note,
        video: false,
        notifyAssignments: studentAssignments,
      })
    }
  })
})
}

exports.postDeleteNotes = (req, res, next) => {
  const noteId = req.body.noteId
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    const note = tutor.notes.find(({ _id }) => _id == noteId)
    if (note.file) {
      deletFiles.deleteFile(note.file)
    }
  })
  Tutor.findByIdAndUpdate(req.session.tutor._id, {
    $pull: { notes: { _id: noteId } },
  })
    .then((tutor) => {
      io.getIO().emit('notifications', {
        action: 'notes-deleting',
        data: tutor.notes,
      })
      res.redirect('/tutor/notes')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getAnnouncements = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    res.render('tutor/announcements', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/announcements',
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      announcements: tutor.announcements,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.postAddAnnouncements = (req, res, next) => {
  const tutorId = req.session.tutor._id
  const message = req.body.inputMessage
  const description = req.body.inputDescription
  const file = req.file;
  if(file){
    var announcementFileUrl = file.path;
    var announcementFileType = file.mimetype;
    var announcementFileOriginalName = file.originalname;
  }

  const date = new Date().toLocaleDateString()

  Tutor.findOne({ _id: req.session.tutor._id })
    .then((tutor) => {
      var addAnnouncements = {}
      if(file){
        addAnnouncements = {
          message: message,
          description: description,
          date: date,
          file: announcementFileUrl,
          filetype: announcementFileType,
          filename: announcementFileOriginalName,
          tutorId: tutorId,
        }
      } else {
      addAnnouncements = {
        message: message,
        description: description,
        date: date,
        tutorId: tutorId,
      }
      }

      tutor.announcements.push(addAnnouncements)
      return tutor.save()
    })
    .then(() => {
      res.redirect('/tutor/announcements')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getAnnouncementsDetails = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    const announcementId = req.params.announcementId
    const announcement = tutor.announcements.find(
      ({ _id }) => _id == announcementId
    )
    if (announcement){
      if (announcement.filetype == 'application/pdf') {
        const announcementRead = announcement.file
        const file = fs.createReadStream(announcementRead)
        res.setHeader('Content-Type', 'application/pdf')
        file.pipe(res)
      } else if (
        announcement.filetype == 'video/mp4' ||
        announcement.filetype == 'video/mkv' ||
        announcement.filetype == 'video/avi'
      ) {
        res.render('tutor/announcements-details', {
          pageTitle: 'Dashboard',
          path: '/tutor',
          sPath: '/tutor/announcements',
          name: tutor.name,
          editing: false,
          isAuthenticated: req.session.isTutorLoggedIn,
          announcement: announcement,
          video: true,
          notifyAssignments: studentAssignments,
        })
      } else {
        res.render('tutor/announcements-details', {
          pageTitle: 'Dashboard',
          path: '/tutor',
          sPath: '/tutor/announcements',
          name: tutor.name,
          editing: false,
          isAuthenticated: req.session.isTutorLoggedIn,
          announcement: announcement,
          video: false,
          notifyAssignments: studentAssignments,
        })
      }
    } else {
      res.render('tutor/announcements-details', {
        pageTitle: 'Dashboard',
        path: '/tutor',
        sPath: '/tutor/announcements',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isTutorLoggedIn,
        announcement: announcement,
        video: false,
        notifyAssignments: studentAssignments,
      })
    }
  })
})
}

exports.postDeleteAnnouncements = (req, res, next) => {
  const announcementId = req.body.announcementId;

  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    const announcement = tutor.announcements.find(
      ({ _id }) => _id == announcementId
    )
    if (announcement.file) {
      deletFiles.deleteFile(announcement.file)
    }
  })

  Tutor.findByIdAndUpdate(req.session.tutor._id, {
    $pull: { announcements: { _id: announcementId } },
  })
    .then(() => {
      res.redirect('/tutor/announcements')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getEvents = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    res.render('tutor/events', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/events',
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      events: tutor.events,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.postAddEvents = (req, res, next) => {
  const tutorId = req.session.tutor._id
  const eventHead = req.body.inputEvent
  const eventBy = req.body.inputEventBy
  const topic = req.body.inputTopic

  const date = req.body.inputDate

  Tutor.findOne({ _id: req.session.tutor._id })
    .then((tutor) => {
      var addEvents = {}
      addEvents = {
        eventHead: eventHead,
        eventBy: eventBy,
        topic: topic,
        date: date,
        tutorId: tutorId,
      }
      tutor.events.push(addEvents)
      return tutor.save()
    })
    .then(() => {
      res.redirect('/tutor/events')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getEventsDetails = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    const eventId = req.params.eventId
    const eventSingle = tutor.events.find(({ _id }) => _id == eventId)
    res.render('tutor/events-details', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/events',
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      event: eventSingle,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.postDeleteEvents = (req, res, next) => {
  const eventId = req.body.eventId
  Tutor.findByIdAndUpdate(req.session.tutor._id, {
    $pull: { events: { _id: eventId } },
  })
    .then(() => {
      res.redirect('/tutor/events')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getPhotos = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    res.render('tutor/images', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/images',
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      images: tutor.images,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.postAddImages = (req, res, next) => {
  
  const tutorId = req.session.tutor._id
  const name = req.body.inputName
  const file = req.file;
  var cropX = Number(req.body.croppedImgX)
  var cropY = Number(req.body.croppedImgY)
  var cropW = Number(req.body.croppedImgW)
  var cropH = Number(req.body.croppedImgH)
  if (file) {
    var url = file.path
  }
  const cropCheck = req.body.cropCheck;
  if (cropCheck == 'true') {

    Clipper.configure('canvas', canvas)

    Clipper(url, function () {
      this.crop(cropX, cropY, cropW, cropH).toFile(url, function () {
        // console.log('saved!')
      })
    })
  }

  const date = new Date().toLocaleDateString()

  Tutor.findOne({ _id: req.session.tutor._id })
    .then((tutor) => {
      var addImages = {}
      if (file) {
        addImages = {
          name: name,
          date: date,
          imageUrl: url,
          tutorId: tutorId,
        }
      } else if (imageUrl) {
        addImages = {
          name: name,
          date: date,
          imageSrc: imageUrl,
          tutorId: tutorId,
        }
      } else {
        addImages = {
          name: name,
          date: date,
          tutorId: tutorId,
        }
      }

      tutor.images.push(addImages)
      return tutor.save()
    })
    .then(() => {
      res.redirect('/tutor/images')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getImageDetails = (req, res, next) => {
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    Student.find({ tutorId: tutor._id }, function (err, students) {
      var studentAssignments = [];
      for (let student of students) {
        studentAssignments.push(student.assignments);
      }
      studentAssignments = studentAssignments
        .flat()
        .slice(Math.max(studentAssignments.length - 5, 0))
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      
    const imageId = req.params.imageId
    const image = tutor.images.find(({ _id }) => _id == imageId)
    res.render('tutor/images-details', {
      pageTitle: 'Dashboard',
      path: '/tutor',
      sPath: '/tutor/images',
      name: tutor.name,
      editing: false,
      isAuthenticated: req.session.isTutorLoggedIn,
      image: image,
      notifyAssignments: studentAssignments,
    })
  })
})
}

exports.postDeleteImages = (req, res, next) => {
  const imageId = req.body.imageId
  Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
    const image = tutor.images.find(({ _id }) => _id == imageId)
    if (image.imageUrl) {
      deletFiles.deleteFile(image.imageUrl)
    }
  })
  Tutor.findByIdAndUpdate(req.session.tutor._id, {
    $pull: { images: { _id: imageId } },
  })
    .then(() => {
      res.redirect('/tutor/images')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getChat = (req, res, next) => {
  var studentId = req.query.studentId;
  if (studentId == null || studentId == undefined || studentId == ''){
    Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
      Student.find({ tutorId: tutor._id }, function (err, allStudents) {
        var studentAssignments = []
        for (let student of allStudents) {
          studentAssignments.push(student.assignments)
        }
        studentAssignments = studentAssignments
          .flat()
          .slice(Math.max(studentAssignments.length - 5, 0))
          .sort(function (a, b) {
            return new Date(a.date) - new Date(b.date)
          })
          .reverse()
        
        var defaultChat = allStudents[0].chat
        var tutorChat = tutor.chat.filter(({ sId }) => sId == allStudents[0]._id)
        var tutorStudentChat = tutorChat.concat(defaultChat)
        tutorStudentChat.sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })

        res.render('tutor/chat', {
          pageTitle: 'Dashboard',
          path: '/tutor',
          sPath: '/tutor/chat',
          name: tutor.name,
          editing: false,
          isAuthenticated: req.session.isTutorLoggedIn,
          notifyAssignments: studentAssignments,
          chats: tutorStudentChat,
          allStudents: allStudents,
          queryStudent: studentId,
          defaultStudentId: allStudents[0]._id,
          isChat: false,
        })
      })
    })
  } else {
    Tutor.findOne({ _id: req.session.tutor._id }, function (err, tutor) {
      Student.find({ tutorId: tutor._id }, function (err, allStudents) {
      Student.findById({ _id: studentId }, function (err, students) {
        var studentAssignments = []
        for (let student of allStudents) {
          studentAssignments.push(student.assignments)
        }
        studentAssignments = studentAssignments
          .flat()
          .slice(Math.max(studentAssignments.length - 5, 0))
          .sort(function (a, b) {
            return new Date(a.date) - new Date(b.date)
          })
          .reverse()

          var tutorChat = tutor.chat.filter(({ sId }) => sId == studentId)
          var tutorStudentChat = tutorChat.concat(students.chat)
          tutorStudentChat.sort(function (a, b) {
            return new Date(a.date) - new Date(b.date)
          })

        res.render('tutor/chat', {
          pageTitle: 'Dashboard',
          path: '/tutor',
          sPath: '/tutor/chat',
          name: tutor.name,
          editing: false,
          isAuthenticated: req.session.isTutorLoggedIn,
          notifyAssignments: studentAssignments,
          student: students,
          chats: tutorStudentChat,
          allStudents: allStudents,
          queryStudent: studentId,
          defaultStudentId: allStudents[0]._id,
          isChat: true,
        })
      })
    })
  })
  }
}

exports.postChatAdd = (req, res, next) => {
  const sId = req.body.sId
  const message = req.body.chatMessage
  const date = new Date().toLocaleDateString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  Tutor.findOne({ _id: req.session.tutor._id })
    .then((tutor) => {
      var chat = {}
      chat = {
        message: message,
        date: date,
        sId: sId,
      }
      tutor.chat.push(chat)
      return tutor.save()
    })
    .then(() => {
      io.getIO().emit('chat', {
        action: 'chat-add'
      })
      var redirectUrl = '/tutor/chat/?studentId='+sId;
      res.redirect(redirectUrl)
    })
    .catch((err) => {
      console.log(err)
    })
}

//Login Routes
exports.getLogin = (req, res, next) => {
  if (req.session.isTutorLoggedIn) {
    res.redirect('/tutor')
  }
  res.render('tutor/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isTutorLoggedIn,
  })
}

exports.getSignup = (req, res, next) => {
  res.render('tutor/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: req.session.isTutorLoggedIn,
  })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  Tutor.findOne({ email: email })
    .then((tutor) => {
      if (!tutor) {
        return res.redirect('/tutor/login')
      }
      bcrypt
        .compare(password, tutor.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isTutorLoggedIn = true
            req.session.tutor = tutor
            return req.session.save((err) => {
              console.log(err)

              res.redirect('/tutor')
            })
          }
          res.redirect('/tutor/login')
        })
        .catch((err) => {
          console.log(err)
          res.redirect('/tutor/login')
        })
    })
    .catch((err) => console.log(err))
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  Tutor.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        return res.redirect('/tutor/signup')
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const tutor = new Tutor({
            email: email,
            password: hashedPassword,
          })
          return tutor.save()
        })
        .then((result) => {
          res.redirect('/tutor/login')
        })
        .catch((err) => {
          console.log(err)
        })
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getOtpLogin = (req, res, next) => {
  if (req.session.isTutorLoggedIn) {
    res.redirect('/tutor')
  }
  res.render('tutor/loginviaotp', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isTutorLoggedIn,
    getOtp: false,
  })
}

exports.postSendOtp = (request, response, next) => {
  var mobile = request.body.phone
  Tutor.findOne({ mobile: mobile })
    .then((tutor) => {
      if (!tutor) {
        return response.redirect('/tutor/login')
      }
      var req = unirest('POST', 'https://d7networks.com/api/verifier/send')
        .headers({
          Authorization: 'Token b200b653dc6824cd602fca91ea401ed29160befc',
        })
        .field('mobile', '+91' + mobile)
        .field('sender_id', 'SMSINFO')
        .field('message', 'Your otp code for Class@Home {code}')
        .field('expiry', '900')
        .followRedirect(false)
        .end(function (res) {
          if (res.error) {
            console.log(res.error)
          }
          var otpDetails = res.raw_body
          var b = JSON.parse(otpDetails)
            var smsId = b.otp_id
            if (smsId) {
              request.session.tutorOtpPhone = mobile;
              request.session.tutorOtpId = smsId;
            }

          response.render('tutor/loginviaotp', {
            path: '/login',
            pageTitle: 'Login',
            isAuthenticated: false,
            getOtp: true,
          })
        })
    })
    .catch((err) => console.log(err))
}

exports.postOtpVerify = (request, response, next) => {
  const getOtp = request.body.otp;
  var req = unirest('POST', 'https://d7networks.com/api/verifier/verify')
    .headers({
      Authorization: 'Token b200b653dc6824cd602fca91ea401ed29160befc',
    })
    .field('otp_id', request.session.tutorOtpId)
    .field('otp_code', getOtp)
    .end(function (res) {
      if (res.error) {
        console.log(res.error)
      }
      console.log(res.raw_body)
      var otpDetails = res.raw_body
      var b = JSON.parse(otpDetails)
      if (b.status == 'success') {
        Tutor.findOne({ mobile: request.session.tutorOtpPhone })
          .then((tutor) => {
            request.session.isTutorLoggedIn = true;
            request.session.tutor = tutor;
            return request.session.save((err) => {

              response.redirect('/tutor')
            })
          })
        
      } else {
        response.redirect('/tutor/login')
      }
    })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect('/')
  })
}
