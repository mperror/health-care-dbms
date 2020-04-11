import React, { useEffect, useState, useContext } from "react";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import "@fullcalendar/core/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";
import "@fullcalendar/list/main.css";

import { AuthContext } from "../Auth";
import { db } from "../firebase";

export default () => {
  const { currentUser } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [open, setOpen] = React.useState(false);
  const [eventPendingOrBooked, setPendingOrBooked] = React.useState(false);
  const [temp, setTemp] = useState({});

  const handleClickOpen = (info) => {
    setOpen(true);

    document.getElementById("modal-title").innerHTML =
      ' <DialogTitle id="modal-title"> <h3>' +
      info.event.title +
      "</ h3> </DialogTitle>";

    document.getElementById("doctor-name").innerHTML =
      ' <DialogContentText  id="doctor-name">' +
      "<h5>" +
      "Doctor: " +
      info.event.extendedProps.docName +
      "<h5>" +
      "</DialogContentText>";

    document.getElementById("start-time").innerHTML =
      ' <DialogContentText  id="start-time">' +
      "<h5>" +
      "Start Time: " +
      info.event.start +
      "<h5>" +
      "</DialogContentText>";

    document.getElementById("end-time").innerHTML =
      ' <DialogContentText  id="end-time">' +
      "<h5>" +
      "End Time: " +
      info.event.end +
      "<h5>" +
      "</DialogContentText>";

    
    if (info.event.extendedProps.status === "open"){
      document.getElementById("buttonCancel").style.visibility = "hidden";
      document.getElementById("buttonBook").style.visibility = "hidden";
    } else if (info.event.extendedProps.status === "booked"){
      document.getElementById("buttonBook").style.visibility = "hidden";      
    }

    setTemp(info.event);
  };

  const handleBook = () => {
    setOpen(false);
    let query = db.collection("Appointment").doc(temp.id);
    query
      .get()
      .then(function (doc) {
        if (doc.exists) {
          if (doc.data().status === "pending") {
            query.update({
              status: "booked",
              // patientID: currentUser.uid,
              title: "Booked",
            });
          }
        }
      })
      .then((_) => {
        setEvents([]);
        getEvents();
      });
    setTemp({});
  };

  const handleCancel = () => {
    setOpen(false);
    let query = db.collection("Appointment").doc(temp.id);
    query
      .get()
      .then(function (doc) {
        if (doc.exists) {
          if (
            doc.data().status === "booked" ||
            doc.data().status === "pending"
          ) {
            query.update({
              status: "open",
              patientID: "N/A",
              title: "Open",
            });
          }
        }
      })
      .then((_) => {
        setEvents([]);
        getEvents();
      });
    setTemp({});
  };

  const handleClose = () => {
    setOpen(false);
    setTemp({});
  };

  /**
   * Retrieves all events related to the doctos
   */
  function getEvents() {
    const docApt = [];

    var queryNurse = db.collection("Users").where("uid", "==", currentUser.uid);
    queryNurse.get().then(function (doc) {
      doc.forEach((d) => {
        let docID = d.data().docList[0];

        var queryDoctor = db
          .collection("Appointment")
          .where("doctorID", "==", docID);
        queryDoctor
          .get()
          .then(function (querySnapshot) {
            querySnapshot.forEach((doc) => {
              // Reformating time format for full calendar event

              // Seting the Unix time
              const epochStart = doc.data().start.seconds;
              const epochEnd = doc.data().end.seconds;

              // Initilizing new Date objets
              let start = new Date(0);
              let end = new Date(0);

              // Set date object times to Unix time from event object
              start.setUTCSeconds(epochStart);
              end.setUTCSeconds(epochEnd);

              const event = doc.data();
              event.start = start;
              event.end = end;
              event.id = doc.id;
              event.status = doc.data().status;

              // Set the event colour depending on its status
              if (doc.data().status === "booked") {
                event.color = "blue"; // Blue
              } else if (doc.data().status === "pending") {
                event.color = "orange"; // Yellow
              } else if (doc.data().status === "open") {
                event.color = "green";
              }

              docApt.push(event);
            });
          })
          .then(() => {
            setEvents(docApt);
          });
      });
    });
  }

  useEffect(() => {
    getEvents(); // Change event state and mount
  }, []);


  // Render view
  return (
    <>
      <div style={{ paddingTop: 20 }}>
        <FullCalendar
          defaultView="dayGridMonth"
          header={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
          }}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          handleWindowResize={true}
          events={events}
          editable={true}
          themeSystem="bootstrap"
          allDay={true}
          aspectRatio={2}
          displayEventEnd={true}
          eventClick={handleClickOpen}
        />
      </div>
      <Dialog open={open} onClick={handleClose}>
        <DialogTitle disableTypography id="modal-title">
          <h3> Modal Title </h3>
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="doctor-name">
            Appointment Content goes here
          </DialogContentText>
          <DialogContentText id="start-time">
            Appointment Content goes here
          </DialogContentText>
          <DialogContentText id="end-time">
            Appointment Content goes here
          </DialogContentText>
        </DialogContent>
        <DialogActions >
          <Button id="buttonCancel" variant="outlined" onClick={handleCancel} color="secondary">
            Cancel
          </Button>
          <Button id="buttonBook" variant="outlined" onClick={handleBook} color="primary">
            Book
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
