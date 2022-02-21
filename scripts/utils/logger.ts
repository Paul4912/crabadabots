import TimeHelper from '../utils/timeHelper';
import chalk from 'chalk';

export enum LogAction {
  Info = 'INFO',
  Error = 'ERROR',
  Success = 'SUCCESS'
}

class Logger {
  Log(severity: LogAction, message: string) {
    let colouredSeverity = null;
    let colouredTime = null;
    let colouredMessage = null;

    switch(severity) {
      case LogAction.Info:
        colouredSeverity = chalk.blue(severity);
        colouredTime = chalk.blue(TimeHelper.getCurrentTime());
        colouredMessage = message;
        break;
      case LogAction.Error:
        colouredSeverity = chalk.red(severity);
        colouredTime = chalk.red(TimeHelper.getCurrentTime());
        colouredMessage = chalk.red(message);
        break;
      case LogAction.Success:
        colouredSeverity = chalk.yellow(severity);
        colouredTime = chalk.yellow(TimeHelper.getCurrentTime());
        colouredMessage = chalk.yellow(message);
        break;
      default:
        console.log(`Log action ${severity} not supported.`)
        process.exit(1);
    }
    
    console.log(`[${colouredSeverity}][${colouredTime}]:: `, colouredMessage);
  }
}

const logger = new Logger();

export default logger;