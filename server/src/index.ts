import { CommandParser } from "./CommandParser";
import { StdioCommandInterface } from "./StdioInterface";

new StdioCommandInterface(new CommandParser()).run();
