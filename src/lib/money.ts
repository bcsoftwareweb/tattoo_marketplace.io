export function depositSplit(quote: number, deposit: number, percent: number) {
  const commission = Math.round((deposit * percent) / 100);
  return {
    amount: deposit,
    commission,
    artistNet: deposit - commission,
  };
}

export function balanceSplit(quote: number, deposit: number, percent: number) {
  const balance = quote - deposit;
  const totalCommission = Math.round((quote * percent) / 100);
  const depositCommission = Math.round((deposit * percent) / 100);
  const commission = totalCommission - depositCommission;
  return {
    amount: balance,
    commission,
    artistNet: balance - commission,
    totalCommission,
  };
}

export function quoteSplit(quote: number, deposit: number, percent: number) {
  const totalCommission = Math.round((quote * percent) / 100);
  return {
    quote,
    deposit,
    balance: quote - deposit,
    commission: totalCommission,
    artistNet: quote - totalCommission,
  };
}
