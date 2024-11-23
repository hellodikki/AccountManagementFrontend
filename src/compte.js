import React, { useState } from 'react';
import { ApolloClient, InMemoryCache, ApolloProvider, useQuery, useMutation, gql } from '@apollo/client';
import './Compte.css';
import TransactionPanel from './Transaction';

const GET_ALL_COMPTES = gql`
  query {
    allComptes {
      id
      solde
      dateCreation
      type
    }
  }
`;

const GET_COMPTES_BY_TYPE = gql`
  query($type: TypeCompte!) {
    comptesByType(type: $type) {
      id
      solde
      dateCreation
      type
    }
  }
`;

const GET_TOTAL_SOLDE = gql`
  query {
    totalSolde {
      count
      sum
      average
    }
  }
`;

const SAVE_COMPTE = gql`
  mutation SaveCompte($compteInput: CompteInput!) {
    saveCompte(compteInput: $compteInput) {
      id
      solde
      dateCreation
      type
    }
  }
`;

const DELETE_COMPTE = gql`
  mutation DeleteCompte($id: ID!) {
    deleteCompte(id: $id)
  }
`;

const formatMoney = (amount) => {
  return `${amount.toFixed(2)} MAD`;
};

const App = () => {
  const [selectedType, setSelectedType] = useState('COURANT');
  const [showAddForm, setShowAddForm] = useState(false);

  
  return (
    <div className="container">
      <div className="content">
        <h1 className="title">Gestion des Comptes Bancaires</h1>
        <div className="grid-container">
          <div>
            <ComptesList />
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="button button-blue"
            >
              {showAddForm ? 'Fermer' : 'Ajouter un compte'}
            </button>
            {showAddForm && <AddCompteForm onSuccess={() => setShowAddForm(false)} />}
          </div>
          <div>
            <TotalSolde />
            <div className="card" style={{marginTop: '20px'}}>
              <h2 className="title">Filtrer par type</h2>
              <select 
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="form-input"
              >
                <option value="COURANT">Courant</option>
                <option value="EPARGNE">Épargne</option>
              </select>
              <ComptesByType type={selectedType} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComptesList = () => {
  const { loading, error, data, refetch } = useQuery(GET_ALL_COMPTES);
  const [deleteCompte] = useMutation(DELETE_COMPTE);
  const [selectedCompte, setSelectedCompte] = useState(null);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error.message}</div>;

  const handleDelete = async (id) => {
    try {
      const { data } = await deleteCompte({ 
        variables: { id: id.toString() }  // Assurez-vous que l'ID est une chaîne
      });
      
      if (data.deleteCompte) {
        // Suppression réussie
        refetch();  // Actualiser la liste
      } else {
        // Échec de la suppression
        console.error("Échec de la suppression du compte");
        alert("Impossible de supprimer ce compte");
      }
    } catch (err) {
      console.error("Erreur lors de la suppression:", err);
      alert("Erreur lors de la suppression du compte");
    }
  };

  return (
    <div className="card">
      <h2 className="title">Liste des Comptes</h2>
      <div className="space-y-4">
        {data.allComptes.map((compte) => (
          <div key={compte.id} className="compte-item">
            <div 
              onClick={() => setSelectedCompte(selectedCompte === compte.id ? null : compte.id)}
              style={{ cursor: 'pointer' }}
            >
              <p className="font-semibold">ID: {compte.id}</p>
              <p>Solde: {formatMoney(compte.solde)}</p>
              <p>Type: {compte.type}</p>
              <p>Date: {new Date(compte.dateCreation).toLocaleDateString()}</p>
            </div>
            <button
              onClick={() => handleDelete(compte.id)}
              className="button button-red"
            >
              Supprimer
            </button>
            {selectedCompte === compte.id && (
              <TransactionPanel compteId={compte.id} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const AddCompteForm = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    solde: '',
    type: 'COURANT',
    dateCreation: new Date().toISOString().split('T')[0]
  });

  const [saveCompte] = useMutation(SAVE_COMPTE, {
    refetchQueries: [
      { query: GET_ALL_COMPTES },
      { query: GET_TOTAL_SOLDE }
    ]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveCompte({
        variables: {
          compteInput: {
            ...formData,
            solde: parseFloat(formData.solde)
          }
        }
      });
      onSuccess();
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{marginTop: '15px'}}>
      <h2 className="title">Nouveau Compte</h2>
      <div className="form-group">
        <label className="form-label">Solde</label>
        <input
          type="number"
          step="0.01"
          value={formData.solde}
          onChange={(e) => setFormData({ ...formData, solde: e.target.value })}
          className="form-input"
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">Type</label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="form-input"
        >
          <option value="COURANT">Courant</option>
          <option value="EPARGNE">Épargne</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Date de création</label>
        <input
          type="date"
          value={formData.dateCreation}
          onChange={(e) => setFormData({ ...formData, dateCreation: e.target.value })}
          className="form-input"
          required
        />
      </div>
      <button type="submit" className="button button-green">
        Créer le compte
      </button>
    </form>
  );
};

const TotalSolde = () => {
  const { loading, error, data } = useQuery(GET_TOTAL_SOLDE);

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error.message}</div>;

  return (
    <div className="card">
      <h2 className="title">Statistiques</h2>
      <div className="stats-grid">
        <div>
          <p>Nombre de comptes</p>
          <p>{data.totalSolde.count}</p>
        </div>
        <div>
          <p>Somme totale</p>
          <p>{data.totalSolde.sum}MAD</p>
        </div>
        <div>
          <p>Moyenne</p>
          <p>{data.totalSolde.average.toFixed(2)}MAD</p>
        </div>
      </div>
    </div>
  );
};

const ComptesByType = ({ type }) => {
  const { loading, error, data } = useQuery(GET_COMPTES_BY_TYPE, {
    variables: { type }
  });

  if (loading) return <div className="loading">Chargement...</div>;
  if (error) return <div className="error">Erreur : {error.message}</div>;

  return (
    <div style={{marginTop: '15px'}}>
      <h3>Comptes de type {type}</h3>
      <div className="space-y-2">
        {data.comptesByType.map((compte) => (
          <div key={compte.id} className="compte-item">
            <p>ID: {compte.id}</p>
            <p>Solde: {formatMoney(compte.solde)}</p>
            <p>Date: {new Date(compte.dateCreation).toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const client = new ApolloClient({
  uri: 'http://localhost:8082/graphql',
  cache: new InMemoryCache()
});

const ApolloApp = () => (
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>
);

export default ApolloApp;