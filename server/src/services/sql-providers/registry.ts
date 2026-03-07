import type { SqlProvider } from '../../types/profile';
import { BaseSqlProvider, type SqlProviderConstructor } from './types';

const providerRegistry = new Map<SqlProvider, BaseSqlProvider>();

export function registerSqlProvider(provider: BaseSqlProvider): void {
  providerRegistry.set(provider.provider, provider);
}

export function SqlProvider(providerName: SqlProvider) {
  return <TConstructor extends SqlProviderConstructor>(Target: TConstructor): TConstructor => {
    const instance = new Target();
    if (instance.provider !== providerName) {
      throw new Error(
        `SqlProvider decorator mismatch: expected ${providerName}, got ${instance.provider}`
      );
    }

    registerSqlProvider(instance);
    return Target;
  };
}

export function getSqlProviderAdapter(provider: SqlProvider): BaseSqlProvider {
  const adapter = providerRegistry.get(provider);
  if (!adapter) {
    throw new Error(`Unsupported SQL provider: ${provider}`);
  }
  return adapter;
}

export function getRegisteredSqlProviders(): SqlProvider[] {
  return [...providerRegistry.keys()];
}

export function isRegisteredSqlProvider(value: unknown): value is SqlProvider {
  return typeof value === 'string' && providerRegistry.has(value);
}
