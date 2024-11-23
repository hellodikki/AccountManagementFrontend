import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';

const GET_TRANSACTIONS = gql`
  query($compteId: ID!) {
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
  mutation($transaction: TransactionInput!) {
    addTransaction(transaction: $transaction) {
      id
      montant
      type
      dateTransaction
      description
    }
  }
`;

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
      <button onClick={() => setShowForm(!showForm)}>
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
        {data.transactionsByCompte.map(transaction => (
          <div key={transaction.id} className="transaction-item">
            <div className={`transaction-type ${transaction.type.toLowerCase()}`}>
              {transaction.type}
            </div>
            <div className="transaction-amount">
              {transaction.type === 'RETRAIT' ? '-' : '+'}{transaction.montant}€
            </div>
            <div className="transaction-date">
              {new Date(transaction.dateTransaction).toLocaleString()}
            </div>
            <div className="transaction-description">
              {transaction.description}
            </div>
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

  const [addTransaction] = useMutation(ADD_TRANSACTION);

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
        />
      </div>
      <div className="form-group">
        <label>Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
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
        />
      </div>
      <button type="submit">Effectuer la transaction</button>
    </form>
  );
};

export default TransactionPanel;