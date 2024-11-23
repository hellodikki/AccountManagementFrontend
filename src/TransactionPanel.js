import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import './TransactionPanel.css';

const GET_TRANSACTIONS = gql`
  query GetTransactions($compteId: ID!) {
    transactionsByCompte(compteId: $compteId) {
      id
      montant
      type
      dateTransaction
      description
    }
  }
`;

const ADD_TRANSACTION = gql`
  mutation AddTransaction($transaction: TransactionInput!) {
    addTransaction(transaction: $transaction) {
      id
      montant
      type
      dateTransaction
      description
    }
  }
`;

const formatMoney = (amount) => {
  return `${amount.toFixed(2)} MAD`;
};

const TransactionPanel = ({ compteId }) => {
  const [showForm, setShowForm] = useState(false);
  const { loading, error, data, refetch } = useQuery(GET_TRANSACTIONS, {
    variables: { compteId }
  });

  if (loading) return <div>Chargement des transactions...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div className="transactions-panel">
      <h3>Transactions</h3>
      <button 
        onClick={() => setShowForm(!showForm)}
        className="button button-blue"
      >
        {showForm ? 'Fermer' : 'Nouvelle Transaction'}
      </button>
      
      {showForm && (
        <TransactionForm 
          compteId={compteId} 
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}

      <div className="transactions-list">
        {data?.transactionsByCompte?.map(transaction => (
          <div key={transaction.id} className="transaction-item">
            <div className={`transaction-type ${transaction.type.toLowerCase()}`}>
              {transaction.type}
            </div>
            <div className={`transaction-amount ${transaction.type.toLowerCase()}`}>
              {transaction.type === 'RETRAIT' ? '-' : '+'}
              {formatMoney(transaction.montant)}
            </div>
            <div className="transaction-date">
              {new Date(transaction.dateTransaction).toLocaleString()}
            </div>
            {transaction.description && (
              <div className="transaction-description">
                {transaction.description}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TransactionForm = ({ compteId, onSuccess }) => {
  const [formData, setFormData] = useState({
    montant: '',
    type: 'DEPOT',
    description: ''
  });

  const [addTransaction] = useMutation(ADD_TRANSACTION, {
    refetchQueries: [
      {
        query: GET_TRANSACTIONS,
        variables: { compteId }
      }
    ]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addTransaction({
        variables: {
          transaction: {
            ...formData,
            compteId,
            montant: parseFloat(formData.montant)
          }
        }
      });
      onSuccess();
    } catch (err) {
      console.error("Erreur lors de l'ajout de la transaction:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="transaction-form">
      <div className="form-group">
        <label>Montant</label>
        <input
          type="number"
          step="0.01"
          value={formData.montant}
          onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
          required
          className="form-input"
        />
      </div>
      <div className="form-group">
        <label>Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="form-input"
        >
          <option value="DEPOT">Dépôt</option>
          <option value="RETRAIT">Retrait</option>
        </select>
      </div>
      <div className="form-group">
        <label>Description</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description de la transaction"
          className="form-input"
        />
      </div>
      <button type="submit" className="button button-green">
        Effectuer la transaction
      </button>
    </form>
  );
};

export default TransactionPanel;