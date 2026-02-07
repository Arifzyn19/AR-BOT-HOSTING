import { Injectable, Logger } from '@nestjs/common';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { Command } from '../types/command.types';

@Injectable()
export class CommandLoader {
  private readonly logger = new Logger(CommandLoader.name);
  private commands = new Map<string, Command>();
  private aliases = new Map<string, string>(); // alias -> commandName

  async loadCommands(): Promise<void> {
    const commandsPath = join(__dirname, '..', 'commands');
    
    try {
      const categories = readdirSync(commandsPath).filter((file) => {
        const fullPath = join(commandsPath, file);
        return statSync(fullPath).isDirectory();
      });

      for (const category of categories) {
        const categoryPath = join(commandsPath, category);
        const files = readdirSync(categoryPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

        for (const file of files) {
          try {
            const commandPath = join(categoryPath, file);
            const commandModule = await import(commandPath);
            const command: Command = commandModule.default;

            if (!command || !command.config || !command.execute) {
              this.logger.warn(`Invalid command format in ${category}/${file}`);
              continue;
            }

            // Register main command
            this.commands.set(command.config.name, command);

            // Register aliases
            if (command.config.aliases) {
              command.config.aliases.forEach((alias) => {
                this.aliases.set(alias, command.config.name);
              });
            }

            this.logger.log(
              `✅ Loaded command: ${command.config.name} [${category}]` +
              (command.config.aliases?.length ? ` (aliases: ${command.config.aliases.join(', ')})` : '')
            );
          } catch (error) {
            this.logger.error(`Failed to load command ${category}/${file}:`, error);
          }
        }
      }

      this.logger.log(`📦 Loaded ${this.commands.size} commands with ${this.aliases.size} aliases`);
    } catch (error) {
      this.logger.error('Failed to load commands:', error);
    }
  }

  getCommand(nameOrAlias: string): Command | undefined {
    // Try direct name first
    const command = this.commands.get(nameOrAlias);
    if (command) return command;

    // Try alias
    const commandName = this.aliases.get(nameOrAlias);
    if (commandName) {
      return this.commands.get(commandName);
    }

    return undefined;
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  getCommandsByCategory(category: string): Command[] {
    return Array.from(this.commands.values()).filter(
      (cmd) => cmd.config.category === category
    );
  }

  reloadCommands(): Promise<void> {
    this.commands.clear();
    this.aliases.clear();
    return this.loadCommands();
  }
}
