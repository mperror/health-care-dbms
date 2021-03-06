import React, { useEffect, useState, useContext } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import "@fullcalendar/core/main.css";
import "@fullcalendar/daygrid/main.css";
import "@fullcalendar/timegrid/main.css";
import "@fullcalendar/list/main.css";

import { Modal, Button } from "react-bootstrap";

import { AuthContext } from "../Auth";
import { db } from "../firebase";

/**
 * Component the sets up the layout for the doctor page of the
 * system
 *
 * @param {prop objects} props props needed for the component to render
 * @author Justin Flores
 */
export default function DocCalendar(props) {
  const { currentUser } = useContext(AuthContext); // used to retrieve current user id
  const [events, setEvents] = useState([]); // event state
  const [chosenEvent, setChosenEvent] = useState({
    status: "",
    patientID: "",
    date: "",
    start: "",
    end: "",
  });
  const [show, setShow] = useState(false);

  /// Options for the calendar component
  const options = {
    defaultView: "dayGridMonth",
    header: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
    },
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    eventColor: "#378006", // Greenish
    displayEventEnd: true,
  };

  /**
   * Show the modal with the proper event information
   *
   * @param {event object} e an object returned by EventAPI
   */
  function showModal(e) {
    console.log(e.event);
    const modalStart = new Date(e.event.start);
    const modalEnd = new Date(e.event.end);

    console.log("patiendID", e.event.extendedProps.patientID);
    let patientQuery = db.collection("Users").doc(e.event.extendedProps.patientID);
    patientQuery.get()
    .then(function (user) {
      if (user.exists){
        console.log("test", e.event.extendedProps.patientID);
        setChosenEvent({
          status: e.event.extendedProps.status,
          patientID: user.data().fname + " " + user.data().lname,
          date: modalStart.toDateString(),
          start: modalStart.toLocaleTimeString(),
          end: modalEnd.toLocaleTimeString(),
        });
      } else {
        setChosenEvent({
          status: e.event.extendedProps.status,
          patientID: e.event.extendedProps.patientID,
          date: modalStart.toDateString(),
          start: modalStart.toLocaleTimeString(),
          end: modalEnd.toLocaleTimeString(),
          // user.data().fname + " " + user.data().lname,
        });
      }
      setShow(true);
    });
  }

  /**
   * Closes the modal
   */
  function closeModal() {
    setShow(false);
  }

  /**
   * Retrieves all events related to the doctor
   */
  function getEvents() {
    const docApt = [];

    db.collection("Appointment")
      .where("doctorID", "==", currentUser.uid)
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

          // Set appointment colour based on status
          switch (doc.data().status) {
            case "open":
              event.color = "green";
              break;
            case "pending":
              event.color = "orange";
              break;
            default:
              event.color = "blue";
              break;
          }
          docApt.push(event);
        });
      })
      .then(() => {
        setEvents(docApt);
      });
  }

  useEffect(() => {
    getEvents(); // Change event state and mount
  }, []);

  // Render view
  return (
    <div className="content">
      <div className="calendar" style={{ paddingTop: 10 }}>
        <FullCalendar {...options} events={events} eventClick={showModal} />
      </div>

      <Modal show={show} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Appointment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <strong>Status:</strong> {chosenEvent.status}
          </p>

          <p>
            <strong>Patient ID:</strong> {chosenEvent.patientID}
          </p>

          <p>
            <strong>Date:</strong> {chosenEvent.date}
          </p>

          <p>
            <strong>Start time:</strong> {chosenEvent.start}
          </p>

          <p>
            <strong>End time:</strong> {chosenEvent.end}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={closeModal}>Close</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
