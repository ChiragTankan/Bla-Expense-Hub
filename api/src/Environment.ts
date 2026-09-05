export enum Environment {
  Development = 'dev',
  Production = 'prd',
  Test = 'test',
  CI = 'ci',
}

export function parseNodeEnv(nodeEnv: string) {
  const normalisedEnv = (nodeEnv || '').toUpperCase();
  if (normalisedEnv === Environment.Production.toUpperCase()) {
    return Environment.Production;
  }
  if (normalisedEnv === Environment.Test.toUpperCase()) {
    return Environment.Test;
  }
  if (normalisedEnv === Environment.CI.toUpperCase()) {
    return Environment.CI;
  }
  if (normalisedEnv === Environment.Development.toUpperCase()) {
    return Environment.Development;
  }
  return Environment.Development;
}
