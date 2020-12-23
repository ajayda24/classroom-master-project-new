const fs = require('fs')
const path = require('path')

const deletFiles = require('../util/deleteFiles')
const io = require('../socket')

const bcrypt = require('bcryptjs')
var unirest = require('unirest')
var Razorpay = require('razorpay')

var instance = new Razorpay({
  key_id: 'rzp_test_uHg1pC3lqMlNyl',
  key_secret: 'zq69JL3eH1zppEZd35u3qAkQ',
})

const Student = require('../models/student')
const Tutor = require('../models/tutor')

exports.getIndex = (req, res, next) => {
  const studentId = req.session.student._id.toString()
  const folderName = 'studentFiles/' + studentId
  try {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName)
    }
  } catch (err) {
    console.error(err)
  }

  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const lastAnn = tutor.announcements.slice(
        Math.max(tutor.announcements.length - 5, 0)
      )

      const lastAnnSort = lastAnn.reverse()
      const lastevents = student.events.slice(
        Math.max(tutor.events.length - 5, 0)
      )
      const lastEventsSort = lastevents.reverse()

      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

      res.render('student/index', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        announcements: lastAnnSort,
        events: lastEventsSort,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
      // const date = new Date().toLocaleDateString()
      // if(student.attendance.present == '' || student.attendance.present == null){

      // }
      // const date1 = new Date(student.attendance.date)
      // const date2 = new Date(date)
      // const diffTime = Math.abs(date2 - date1)
      // const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      // console.log(diffDays + ' days')
      // if (diffDays > 0) {
      //   student.attendance.absent = diffDays
      // }
    })
  })
}

exports.getTask = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const currentDate = new Date().toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
      const assignment = tutor.assignments.filter(
        ({ date }) =>
          new Date(date).toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }) == currentDate
      )

      const oldAssignments = tutor.assignments.filter(
        ({ date }) =>
          new Date(date).toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }) < currentDate
      )

      const note = tutor.notes.filter(
        ({ date }) =>
          new Date(date).toLocaleDateString(undefined, {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }) == currentDate
      )

      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

      res.render('student/task', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/task',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        assignments: assignment,
        notes: note,
        oldAssignments: oldAssignments,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
    })
  })
}

exports.getAttendance = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const today = new Date().toLocaleDateString()
      const todayAttendance = student.attendance.find(
        ({ date }) => date == today
      )
      // const todayAttendance = student.attendance.filter(({ date }) => date);

      const attendanceNewEntry = student.attendance.reverse()

      var date = new Date(today)
      var dd = String(date.getDate()).padStart(2, '0')
      var mm = String(date.getMonth() + 1).padStart(2, '0') //January is 0!
      var yyyy = date.getFullYear()

      monthYear = mm + '  /  ' + yyyy

      // const diffInDays = Math.abs(today - student.attendance.date) / (1000 * 60 * 60 * 24)
      const lastAttendance = attendanceNewEntry[0]
      if (lastAttendance) {
        const d1 = new Date(lastAttendance.date)
        const d2 = new Date(today)
        const diffTime = Math.abs(d2 - d1)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        var lastUpdated = lastAttendance.lastUpdated
        if (!todayAttendance != false && diffDays > 1 && lastUpdated != today) {
          var z = new Date()
          for (var i = 0; i < diffDays; i++) {
            z.setDate(z.getDate() - i)
            var y = z.toLocaleDateString()
            var attendance = {
              date: y,
              present: false,
              lastUpdated: today,
            }
            student.attendance.push(attendance)
          }
          student.save()
        }
      }

      let present = []
      let absent = []
      for (let i = 0; i < student.attendance.length; i++) {
        if (student.attendance[i].present == true) {
          present.push(student.attendance[i])
        }
      }
      for (let i = 0; i < student.attendance.length; i++) {
        if (student.attendance[i].present == false) {
          absent.push(student.attendance[i])
        }
      }

      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

      res.render('student/attendance', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/attendance',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        present: present.length,
        absent: absent.length,
        monthYear: monthYear,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
    })
  })
}

exports.getAssignments = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      res.render('student/assignments', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/assignments',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        assignments: student.assignments,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
    })
  })
}

exports.postAddAssignments = (req, res, next) => {
  const studentId = req.session.student._id
  const topic = req.body.inputTopic
  const questions = req.body.inputAnswers
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

  Student.findOne({ _id: req.session.student._id })
    .then((student) => {
      var addAssignments = {}
      if (file) {
        addAssignments = {
          topic: topic,
          content: questions,
          date: date,
          file: fileUrl,
          filetype: fileType,
          studentId: studentId,
          mark: '',
        }
      } else {
        addAssignments = {
          topic: topic,
          content: questions,
          date: date,
          studentId: studentId,
          mark: '',
        }
      }

      student.assignments.push(addAssignments)
      return student.save()
    })
    .then((student) => {
      io.getIO().emit('notifications', {
        action: 'assignment-adding',
        data: student.assignments,
      })
      res.redirect('/student/assignments')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getAssignmentsDetails = (req, res, next) => {
  const assignmentId = req.params.assignmentId
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const assignment = tutor.assignments.find(
        ({ _id }) => _id == assignmentId
      )
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      if (assignment.filetype == 'application/pdf') {
        const assignmentRead = assignment.file
        const file = fs.createReadStream(assignmentRead)
        res.setHeader('Content-Type', 'application/pdf')
        file.pipe(res)
      } else {
        res.render('student/assignments-details', {
          pageTitle: 'Dashboard',
          path: '/student',
          sPath: '/student/assignments',
          name: student.name,
          editing: false,
          isAuthenticated: req.session.isStudentLoggedIn,
          assignment: assignment,
          tutorAssignmentsNotes: tutorAssignmentsNotes,
        })
      }
    })
  })
}

exports.getStudentAssignmentsDetails = (req, res, next) => {
  const assignmentId = req.params.assignmentId
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const assignment = student.assignments.find(
        ({ _id }) => _id == assignmentId
      )
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      if (assignment.filetype == 'application/pdf') {
        const assignmentRead = assignment.file
        const file = fs.createReadStream(assignmentRead)
        res.setHeader('Content-Type', 'application/pdf')
        file.pipe(res)
      } else {
        res.render('student/assignments-details', {
          pageTitle: 'Dashboard',
          path: '/student',
          sPath: '/student/assignments',
          name: student.name,
          editing: false,
          isAuthenticated: req.session.isStudentLoggedIn,
          assignment: assignment,
          tutorAssignmentsNotes: tutorAssignmentsNotes,
        })
      }
    })
  })
}

exports.postDeleteAssignments = (req, res, next) => {
  const assignmentId = req.body.assignmentId
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    const assignment = student.assignments.find(
      ({ _id }) => _id == assignmentId
    )
    if (assignment.file) {
      deletFiles.deleteFile(assignment.file)
    }
  })
  Student.findByIdAndUpdate(req.session.student._id, {
    $pull: { assignments: { _id: assignmentId } },
  })
    .then((student) => {
      io.getIO().emit('notifications', {
        action: 'assignment-adding',
        data: student.assignments,
      })
      res.redirect('/student/assignments')
    })
    .catch((err) => {
      console.log(err)
    })
}

exports.getAnnouncements = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const announcement = tutor.announcements.reverse()
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      res.render('student/announcements', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/announcements',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        announcements: announcement,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
    })
  })
}

exports.getAnnouncementsDetails = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const announcementId = req.params.announcementId
      const announcement = tutor.announcements.find(
        ({ _id }) => _id == announcementId
      )
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      res.render('student/announcements-details', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/announcements',
        name: tutor.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        announcement: announcement,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
      // }
    })
  })
}

exports.getEvents = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const tutorEvents = tutor.events.sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

      const today = new Date().toLocaleDateString(undefined, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })

      // var tutorUpdatedAt = tutorEvents.filter(({ updatedAt }) => updatedAt == today)
      
      var studentAllEvent = student.events.reverse();
      var studentLastEvent = studentAllEvent[0];
      var events = [];
      if (studentLastEvent){
        if (
          studentLastEvent.modifiedAt != today ||
          studentLastEvent.modifiedAt != null ||
          studentLastEvent.modifiedAt != undefined ||
          studentLastEvent.modifiedAt != ''
        ) {
          for (var i = 0; i < tutorEvents.length; i++) {
            if (tutorEvents[i].paidEvent == true){
              var studentEvents = {
                eventHead: tutorEvents[i].eventHead,
                eventBy: tutorEvents[i].eventBy,
                topic: tutorEvents[i].topic,
                date: tutorEvents[i].date,
                file: tutorEvents[i].file,
                filetype: tutorEvents[i].filetype,
                filename: tutorEvents[i].filename,
                paidEvent: tutorEvents[i].paidEvent,
                eventPrice: tutorEvents[i].eventPrice,
                eventAccess: false,
                updatedAt: tutorEvents[i].updatedAt,
                modifiedAt: today,
              }
            } else {
              var studentEvents = {
                eventHead: tutorEvents[i].eventHead,
                eventBy: tutorEvents[i].eventBy,
                topic: tutorEvents[i].topic,
                date: tutorEvents[i].date,
                file: tutorEvents[i].file,
                filetype: tutorEvents[i].filetype,
                filename: tutorEvents[i].filename,
                paidEvent: tutorEvents[i].paidEvent,
                eventPrice: tutorEvents[i].eventPrice,
                updatedAt: tutorEvents[i].updatedAt,
                modifiedAt: today,
              }
            }
            events.push(studentEvents)
          }
          student.save()
          // var studentEvents = []
          // var events = studentEvents.concat(tutorEvents)

        } 
      } else {
        for (var i = 0; i < tutorEvents.length; i++) {
          if (tutorEvents[i].paidEvent == true) {
            var studentEvents = {
              eventHead: tutorEvents[i].eventHead,
              eventBy: tutorEvents[i].eventBy,
              topic: tutorEvents[i].topic,
              date: tutorEvents[i].date,
              file: tutorEvents[i].file,
              filetype: tutorEvents[i].filetype,
              filename: tutorEvents[i].filename,
              paidEvent: tutorEvents[i].paidEvent,
              eventPrice: tutorEvents[i].eventPrice,
              eventAccess: false,
              updatedAt: tutorEvents[i].updatedAt,
              modifiedAt: today,
            }
          } else {
            var studentEvents = {
              eventHead: tutorEvents[i].eventHead,
              eventBy: tutorEvents[i].eventBy,
              topic: tutorEvents[i].topic,
              date: tutorEvents[i].date,
              file: tutorEvents[i].file,
              filetype: tutorEvents[i].filetype,
              filename: tutorEvents[i].filename,
              paidEvent: tutorEvents[i].paidEvent,
              eventPrice: tutorEvents[i].eventPrice,
              updatedAt: tutorEvents[i].updatedAt,
              modifiedAt: today,
            }
          }
          
          student.events.push(studentEvents)
          
        }
        
        student.save()
      }

      

      res.render('student/events', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/events',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        events: student.events,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
    })
  })
}

exports.getEventDetails = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const eventId = req.params.eventId
      const eventSingle = student.events.find(({ _id }) => _id == eventId)
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

      if (eventSingle) {
        if (eventSingle.filetype == 'application/pdf') {
          const eventRead = eventSingle.file
          const file = fs.createReadStream(eventRead)
          res.setHeader('Content-Type', 'application/pdf')
          file.pipe(res)
        } else if (
          eventSingle.filetype == 'video/mp4' ||
          eventSingle.filetype == 'video/mkv' ||
          eventSingle.filetype == 'video/avi'
        ) {
          res.render('student/events-details', {
            pageTitle: 'Dashboard',
            path: '/student',
            sPath: '/student/events',
            name: student.name,
            editing: false,
            isAuthenticated: req.session.isStudentLoggedIn,
            event: eventSingle,
            tutorAssignmentsNotes: tutorAssignmentsNotes,
            video: true,
            eventAccess: eventSingle.eventAccess,
          })
        } else if (
          eventSingle.filetype == 'image/png' ||
          eventSingle.filetype == 'image/jpg' ||
          eventSingle.filetype == 'image/jpeg'
        ) {
          res.render('student/events-details', {
            pageTitle: 'Dashboard',
            path: '/student',
            sPath: '/student/events',
            name: student.name,
            editing: false,
            isAuthenticated: req.session.isStudentLoggedIn,
            event: eventSingle,
            tutorAssignmentsNotes: tutorAssignmentsNotes,
            video: false,
            image: true,
            eventAccess: eventSingle.eventAccess,
          })
        } else {
          res.render('student/events-details', {
            pageTitle: 'Dashboard',
            path: '/student',
            sPath: '/student/events',
            name: student.name,
            editing: false,
            isAuthenticated: req.session.isStudentLoggedIn,
            event: eventSingle,
            tutorAssignmentsNotes: tutorAssignmentsNotes,
            video: false,
            image: false,
            eventAccess: eventSingle.eventAccess,
          })
        }
      }
    })
  })
}

exports.postEventPayment = (req, res, next) => {
  var eventId = req.body.eventId
  var eventIdString = req.body.eventId.toString()
  var eventPrice = parseInt(req.body.eventPrice + '00')
  var options = {
    amount: eventPrice, // amount in the smallest currency unit
    currency: 'INR',
    receipt: eventIdString,
  }
  instance.orders.create(options, function (err, order) {
    if (err) {
      console.log(err)
    } else {
      console.log(order)
      Student.findById({ _id: req.session.student._id }, function (err, student) {
        Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
          var tutorAssignmentsNotes = tutor.assignments
            .concat(tutor.notes)
            .flat()
            .sort(function (a, b) {
              return new Date(a.date) - new Date(b.date)
            })
            .reverse()

          const eventSingle = student.events.find(({ _id }) => _id == eventId)
          res.render('student/events-payment', {
            pageTitle: 'Dashboard',
            path: '/student',
            sPath: '/student/events',
            name: student.name,
            editing: false,
            isAuthenticated: req.session.isStudentLoggedIn,
            tutorAssignmentsNotes: tutorAssignmentsNotes,
            event: eventSingle,
            eventOrder: order,
          })
        })
      })
    }
  })
}

exports.postEventPaymentVerify = (req, res, next) => {
  var eventId = req.body.eventId
  var razorpay_order_id = req.body.razorpay_order_id
  var razorpay_payment_id = req.body.razorpay_payment_id
  var razorpay_signature = req.body.razorpay_signature

  Student.findById({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

      const eventSingle = student.events.find(({ _id }) => _id == eventId)
      const crypto = require('crypto')
      var secret = 'zq69JL3eH1zppEZd35u3qAkQ'
      const hash = crypto
        .createHmac('sha256', secret)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex')

      if (hash == razorpay_signature) {
        console.log('Payment Success')
        eventSingle.eventAccess = true
        return student.save()
        .then( () => {
          res.redirect('/student/events/details/' + eventId)
        })
        .catch( err => {
          console.log(err);
        })
      } else {
        console.log('Payment Failed')
        res.redirect('/tutor/events')
      }
    })
  })
}

exports.getNotes = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      res.render('student/notes', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/notes',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        notes: tutor.notes,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
    })
  })
}

exports.getNotesDetails = (req, res, next) => {
  const notesId = req.params.notesId
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      const note = tutor.notes.find(({ _id }) => _id == notesId)

      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
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
        res.render('student/notes-details', {
          pageTitle: 'Dashboard',
          path: '/student',
          sPath: '/student/notes',
          name: tutor.name,
          editing: false,
          isAuthenticated: req.session.isStudentLoggedIn,
          note: note,
          video: true,
          tutorAssignmentsNotes: tutorAssignmentsNotes,
        })
      } else {
        res.render('student/notes-details', {
          pageTitle: 'Dashboard',
          path: '/student',
          sPath: '/student/notes',
          name: tutor.name,
          editing: false,
          isAuthenticated: req.session.isStudentLoggedIn,
          note: note,
          video: false,
          tutorAssignmentsNotes: tutorAssignmentsNotes,
        })
      }
      const today = new Date().toLocaleDateString()
      const todayAttendance = student.attendance.find(
        ({ date }) => date == today
      )
      if (!todayAttendance) {
        var attendance = {
          date: today,
          present: true,
        }
        student.attendance.push(attendance)
        student.save()
      }
    })
  })
}

exports.getProfile = (req, res, next) => {
  Student.findOne({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()
      res.render('student/profile', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/profile',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        photo: student.photo,
        name: student.name,
        sClass: student.sClass,
        sDivision: student.sDivision,
        email: student.email,
        address: student.address,
        mobile: student.mobile,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
      })
    })
  })
}

exports.getChat = (req, res, next) => {
  Student.findById({ _id: req.session.student._id }, function (err, student) {
    Tutor.findOne({ _id: student.tutorId }, function (err, tutor) {
      var tutorAssignmentsNotes = tutor.assignments
        .concat(tutor.notes)
        .flat()
        .sort(function (a, b) {
          return new Date(a.date) - new Date(b.date)
        })
        .reverse()

      var tutorChat = tutor.chat.filter(({ sId }) => sId == student._id)
      var tutorStudentChat = tutorChat.concat(student.chat)
      tutorStudentChat.sort(function (a, b) {
        return new Date(a.date) - new Date(b.date)
      })

      res.render('student/chat', {
        pageTitle: 'Dashboard',
        path: '/student',
        sPath: '/student/chat',
        name: student.name,
        editing: false,
        isAuthenticated: req.session.isStudentLoggedIn,
        tutorAssignmentsNotes: tutorAssignmentsNotes,
        chats: tutorStudentChat,
        student: student,
      })
    })
  })
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

  Student.findOne({ _id: req.session.student._id })
    .then((student) => {
      var chat = {}
      chat = {
        message: message,
        date: date,
      }
      student.chat.push(chat)
      return student.save()
    })
    .then(() => {
      io.getIO().emit('chat', {
        action: 'chat-add',
      })
      var redirectUrl = '/student/chat/?studentId=' + sId
      res.redirect(redirectUrl)
    })
    .catch((err) => {
      console.log(err)
    })
}

//Login Routes
exports.getLogin = (req, res, next) => {
  if (req.session.isStudentLoggedIn) {
    res.redirect('/student')
  }
  res.render('student/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isStudentLoggedIn,
  })
}

exports.getSignup = (req, res, next) => {
  res.render('student/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: req.session.isStudentLoggedIn,
  })
}

exports.postLogin = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  Student.findOne({ email: email })
    .then((student) => {
      if (!student) {
        return res.redirect('/student/login')
      }
      bcrypt
        .compare(password, student.password)
        .then((doMatch) => {
          if (doMatch) {
            req.session.isStudentLoggedIn = true
            req.session.student = student
            return req.session.save((err) => {
              console.log(err)

              res.redirect('/student')
            })
          }
          res.redirect('/student/login')
        })
        .catch((err) => {
          console.log(err)
          res.redirect('/student/login')
        })
    })
    .catch((err) => console.log(err))
}

exports.postSignup = (req, res, next) => {
  const email = req.body.email
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  Student.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        return res.redirect('/student/signup')
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const tutor = new Student({
            email: email,
            password: hashedPassword,
          })
          return tutor.save()
        })
        .then((result) => {
          res.redirect('/student/login')
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
  if (req.session.isStudentLoggedIn) {
    res.redirect('/student')
  }
  res.render('student/loginviaotp', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: req.session.isStudentLoggedIn,
    getOtp: false,
  })
}

exports.postSendOtp = (request, response, next) => {
  var mobile = request.body.phone
  Student.findOne({ mobile: mobile })
    .then((student) => {
      if (!student) {
        console.log('No Student with this phone number')
        return response.redirect('/student/login')
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
            request.session.studentOtpPhone = mobile
            request.session.studentOtpId = smsId
          }

          response.render('student/loginviaotp', {
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
  const getOtp = request.body.otp
  var req = unirest('POST', 'https://d7networks.com/api/verifier/verify')
    .headers({
      Authorization: 'Token b200b653dc6824cd602fca91ea401ed29160befc',
    })
    .field('otp_id', request.session.studentOtpId)
    .field('otp_code', getOtp)
    .end(function (res) {
      if (res.error) {
        console.log(res.error)
      }
      console.log(res.raw_body)
      var otpDetails = res.raw_body
      var b = JSON.parse(otpDetails)
      if (b.status == 'success') {
        Student.findOne({ mobile: request.session.studentOtpPhone }).then(
          (student) => {
            request.session.isStudentLoggedIn = true
            request.session.student = student
            return request.session.save((err) => {
              response.redirect('/student')
            })
          }
        )
      } else {
        response.redirect('/student/login')
      }
    })
}

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err)
    res.redirect('/')
  })
}
