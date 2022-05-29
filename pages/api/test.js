export default function handler(req, res) {
    var CronJob = require('cron').CronJob;
    var job = new CronJob(
        '* * * * *',
        function () {
            console.log('You will see this message every minute');
        },
        null,
        true,
        // 'America/Los_Angeles'
    );
    job.start()
    res.send({ message: 'success!' })
}