export default function handler(req, res) {
    var cron = require('node-cron');

    cron.schedule('* * * * *', () => {
        console.log('running a task every minute');
    });
    res.send({ message: 'success!' })
}