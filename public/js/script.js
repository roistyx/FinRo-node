document
  .getElementById('timeSlotForm')
  .addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    const startTime = document.getElementById('startTime').value;
    const endTime = document.getElementById('endTime').value;
    const durationMinutes = 30;
    const overlapMinutes = 15;

    // Construct the URL
    const url = `http://localhost:3100/calendar/add-appointment/${startTime}/${endTime}/${durationMinutes}/${overlapMinutes}`;

    // Make a GET request
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        document.getElementById(
          'result'
        ).textContent = `Slots added for ${startTime} and ${endTime}`;
        console.log(data);
      })
      .catch((error) => {
        console.error('Error:', error);
        document.getElementById('result').textContent =
          'Error adding slots.';
      });
  });
