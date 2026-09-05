import { plainToInstance, Transform } from 'class-transformer';
import { IsEnum, IsNumber, validateSync } from 'class-validator';
import { Environment, parseNodeEnv } from '../Environment';

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Transform(
    ({ value }) => {
      if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        if (isNaN(parsed)) {
          throw new Error('PORT must be a valid number');
        }
        return parsed;
      }
      return 4000;
    },
    { toClassOnly: true },
  )
  PORT: number = 4000;
}

export function validate(config: Record<string, unknown>) {
  const nodeEnv = parseNodeEnv((config.NODE_ENV as string) || '');
  config.NODE_ENV = nodeEnv;

  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}

export default () => ({
  app: {
    nodeEnv: parseNodeEnv(process.env.NODE_ENV || ''),
    port: parseInt(process.env.PORT || '4000', 10),
  },
});
