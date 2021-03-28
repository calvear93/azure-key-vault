import parseParams from 'minimist';

/**
 * Retrieves a dictionary with
 * all command line parameters.
 *
 * Returned object has the properties
 * 'cmd' for get main command, 'options'
 * for get boolean params and get(key)
 * method for retrieve -- or - command
 * parameters.
 *
 * @example
 *  // on command exec -e json override
 *  import { getArgs } from './cmd.util.js';
 *
 *  const args = getArgs();
 *
 *  const command = args.cmd; // 'exec'
 *  const name = args['e']; // 'json'
 *  const options = args.options; // ['override']
 *
 * @returns {any} command line parameters.
 */
export function getArgs()
{
    // get command arguments
    const args = parseParams(process.argv.slice(2));
    // extracts cmd and options from args
    const [ cmd, ...options ] = args._;

    args.cmd = cmd?.toLowerCase();
    args.options = options;

    return args;
}
