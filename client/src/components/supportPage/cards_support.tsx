import { CheckIcon } from '@heroicons/react/20/solid';
import tiers from '../../data/tiers';
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PricingCards() {
  return (
    <div className="mx-auto mt-16 grid max-w-lg grid-cols-1 gap-y-6 sm:mt-20 lg:max-w-7xl lg:grid-cols-4 lg:gap-8">
      {tiers.map((tier) => (
        <div
          key={tier.id}
          className={classNames(
            tier.isEnterprise
              ? 'relative bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 border border-blue-400/30 shadow-2xl'
              : tier.featured
                ? 'relative bg-gray-900 shadow-2xl'
                : 'bg-white border border-gray-200',
            // تم إضافة flex flex-col justify-between لتثبيت الأزرار في الأسفل دائماً
            'rounded-3xl p-8 transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between'
          )}
        >
          {/* القسم العلوي: يحتوي على الشارة، العنوان، السعر، والميزات */}
          <div>
            {/* الشارة (Badge) */}
            {tier.badge && (
              <div className="mb-4">
                <span
                  className={classNames(
                    tier.isEnterprise
                      ? 'bg-blue-400/10 text-blue-200 ring-blue-400/30'
                      : 'bg-indigo-50 text-indigo-700 ring-indigo-200',
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset'
                  )}
                >
                  {tier.badge}
                </span>
              </div>
            )}

            {/* العنوان (Title) */}
            <h3
              className={classNames(
                tier.isEnterprise
                  ? 'text-blue-300'
                  : tier.featured
                    ? 'text-indigo-400'
                    : 'text-indigo-600',
                'text-lg font-semibold'
              )}
            >
              {tier.name}
            </h3>

            {/* السعر (Price) */}
            <p className="mt-4 flex items-baseline gap-x-2">
              <span
                className={classNames(
                  tier.featured || tier.isEnterprise
                    ? 'text-white'
                    : 'text-gray-900',
                  'text-5xl font-bold tracking-tight'
                )}
              >
                {tier.priceMonthly}
              </span>

              <span
                className={classNames(
                  tier.featured || tier.isEnterprise
                    ? 'text-gray-300'
                    : 'text-gray-500',
                  'text-base'
                )}
              >
                {tier.id === 'tier-onetime' ? '/once' : '/month'}
              </span>
            </p>

            {/* الوصف (Description) */}
            <p
              className={classNames(
                tier.featured || tier.isEnterprise
                  ? 'text-gray-300'
                  : 'text-gray-600',
                'mt-6 text-base'
              )}
            >
              {tier.description}
            </p>

            {/* الميزات (Features) */}
            <ul
              role="list"
              className={classNames(
                tier.featured || tier.isEnterprise
                  ? 'text-gray-200'
                  : 'text-gray-600',
                'mt-8 space-y-3 text-sm'
              )}
            >
              {tier.features.map((feature) => (
                <li key={feature} className="flex gap-x-3">
                  <CheckIcon
                    className={classNames(
                      tier.isEnterprise
                        ? 'text-blue-300'
                        : tier.featured
                          ? 'text-indigo-400'
                          : 'text-indigo-600',
                      'h-6 w-5 flex-none'
                    )}
                  />
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* القسم السفلي: الزر (Button) */}
          <a
            href={tier.href}
            className={classNames(
              tier.isEnterprise
                ? 'bg-blue-500 text-white hover:bg-blue-400'
                : tier.featured
                  ? 'bg-indigo-500 text-white hover:bg-indigo-400'
                  : 'bg-white text-indigo-600 ring-1 ring-indigo-200 hover:ring-indigo-300',
              'mt-8 block rounded-md px-3.5 py-2.5 text-center text-sm font-semibold transition-all duration-200'
            )}
          >
           Support us
          </a>
        </div>
      ))}
    </div>
  );
}