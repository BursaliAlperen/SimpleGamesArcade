import React, { useState } from 'react';
import { User } from '../types';
import { TONCOIN_MIN_WITHDRAW } from '../constants';
import Button from './ui/Button';
import { BackIcon, ToncoinIcon } from './icons/UIIcons';

interface BankProps {
  user: User | null;
  onWithdraw: (amount: number, address: string) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
}

const Bank: React.FC<BankProps> = ({ user, onWithdraw, onBack }) => {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    setError('');
    setMessage('');

    const withdrawAmount = parseFloat(amount);

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setError('Geçersiz miktar. Lütfen pozitif bir sayı girin.');
      return;
    }
    if (withdrawAmount < TONCOIN_MIN_WITHDRAW) {
      setError(`Minimum çekim miktarı ${TONCOIN_MIN_WITHDRAW} TON.`);
      return;
    }
    if (!user || withdrawAmount > user.coins) {
      setError('Yetersiz bakiye.');
      return;
    }
    
    if (address.trim() === '') {
      setError('Toncoin adresi gerekli.');
      return;
    }
    if (!address.trim().startsWith('UQ')) {
      setError("Geçersiz Toncoin adresi. Adres 'UQ' ile başlamalıdır.");
      return;
    }

    setIsWithdrawing(true);
    const result = await onWithdraw(withdrawAmount, address);
    setIsWithdrawing(false);
    
    if (result.success) {
      setMessage(`Başarılı! ${withdrawAmount} TON, ${address} adresine gönderildi.`);
      setAmount('');
      setAddress('');
    } else {
      setError(result.error || 'Çekim işlemi başarısız oldu.');
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center mb-6">
        <Button onClick={onBack} size="small" variant="secondary">
          <BackIcon className="w-5 h-5"/>
        </Button>
        <h1 className="text-3xl font-bold font-press-start text-cyan-400 text-center flex-grow -ml-8">Banka</h1>
      </div>
      
      <div className="bg-black/20 p-4 rounded-lg mb-6 text-center">
        <p className="text-gray-400">Mevcut Bakiye</p>
        <p className="text-3xl font-bold text-cyan-300 flex items-center justify-center">
          <ToncoinIcon className="w-7 h-7 mr-2" />
          {user?.coins.toFixed(6)}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-1">Miktar (TON)</label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Min. ${TONCOIN_MIN_WITHDRAW}`}
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
            disabled={isWithdrawing}
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1">Toncoin Adresi</label>
          <input
            type="text"
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="UQ..."
            className="w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
            disabled={isWithdrawing}
          />
        </div>
        <Button onClick={handleWithdraw} fullWidth isLoading={isWithdrawing} disabled={isWithdrawing}>
            Çekim Yap
        </Button>
      </div>
      {error && <p className="text-red-400 mt-4 text-center">{error}</p>}
      {message && <p className="text-green-400 mt-4 text-center">{message}</p>}
    </div>
  );
};

export default Bank;
