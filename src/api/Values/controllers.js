import { addHours, addDays, addMonths } from 'date-and-time';

const functionConstructor = (
  readoutsCount,
  reduceFunction,
  toSave,
  reduceCount = -1
) =>
  async (req, res) => {
    if (req.query.deviceId) {
      const device = await wonder.query('tree').findOne({
        id: req.query.deviceId
      });

      const timezone = req.query.timezoneOffset || 0;

      if (device && Math.abs(timezone) <= 720 && timezone % 15 === 0) {
        if (device.user_id === req.user.id) {
          const upperThreshold = new Date();
          const lowerThreshold = new Date(
            toSave-- > 0 ? upperThreshold.getFullYear() : 0,
            toSave-- > 0 ? upperThreshold.getMonth() : 0,
            toSave-- > 0 ? upperThreshold.getDate() : 0,
            toSave-- > 0 ? upperThreshold.getHours() : 0,
            toSave-- > 0 ? upperThreshold.getMinutes() : 0,
            toSave-- > 0 ? upperThreshold.getSeconds() : 0,
            toSave-- > 0 ? upperThreshold.getMilliseconds() : 0
          );

          const resultArray = [];

          for (let i = 0; i < readoutsCount; i += 1) {
            resultArray.push({
              value: await wonder.query('value').sum('last_record', {
                tree_id: device.id,
                time_stamp_db_gte: lowerThreshold,
                time_stamp_db_lt: upperThreshold
              }),
              timeStamp: new Date(
                lowerThreshold.getTime() -
                timezone * 60000
              ).toISOString()
            });

            upperThreshold.setTime(lowerThreshold.getTime());
            lowerThreshold.setTime(
              reduceFunction(lowerThreshold, reduceCount
            ).getTime());
          }

          res.send(resultArray);
          return;
        }

        res.throw(403);
      }
    }

    res.throw(400);
    return;
  };

export default {
  statDay: functionConstructor(24, addHours, 4),
  statMonth: functionConstructor(30, addDays, 3),
  statYear: functionConstructor(12, addMonths, 2)
};