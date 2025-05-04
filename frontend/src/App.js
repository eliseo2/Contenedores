import React, { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

// Elimina o comenta esta línea, ya no la necesitamos para peticiones API
// const API_URL = process.env.REACT_APP_API_URL || "";

const App = () => {
  const [greeting, setGreeting] = useState("");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
 
  // Nuevo formulario para crear usuarios
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    password: ""
  });

  useEffect(() => {
    // Función para cargar todos los datos necesarios
    const loadData = async () => {
      setLoading(true);
      try {
        // Usar rutas relativas en lugar de absolutas
        const greetingResponse = await axios.get(`/api/getData`);
        setGreeting(greetingResponse.data);
       
        // Obtener usuarios
        const usersResponse = await axios.get(`/api/users`);
        setUsers(usersResponse.data);
       
        // Obtener productos
        const productsResponse = await axios.get(`/api/products`);
        setProducts(productsResponse.data);
       
        setError(null);
      } catch (err) {
        console.error("Error al cargar datos:", err);
        setError("Error al cargar datos del servidor. Por favor, intente más tarde.");
      } finally {
        setLoading(false);
      }
    };
   
    loadData();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };

  // Enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // También cambiar aquí a ruta relativa
      const response = await axios.post(`/api/users`, newUser);
      console.log("Usuario creado:", response.data);
     
      // Limpiar formulario
      setNewUser({
        username: "",
        email: "",
        password: ""
      });
     
      // Recargar lista de usuarios (también con ruta relativa)
      const usersResponse = await axios.get(`/api/users`);
      setUsers(usersResponse.data);
     
      alert("Usuario creado correctamente");
    } catch (err) {
      console.error("Error al crear usuario:", err);
      alert("Error al crear usuario");
    }
  };

  if (loading) return <div className="container">Cargando...</div>;
  if (error) return <div className="container error">{error}</div>;

  return (
    <div className="container">
      <header>
        <h1>Proyecto Docker - Aplicación Web</h1>
        <p className="greeting">{greeting}</p>
      </header>
     
      <section className="card">
        <h2>Registrar Nuevo Usuario</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Nombre de usuario:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={newUser.username}
              onChange={handleInputChange}
              required
              minLength="3"
            />
          </div>
         
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={newUser.email}
              onChange={handleInputChange}
              required
            />
          </div>
         
          <div className="form-group">
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={newUser.password}
              onChange={handleInputChange}
              required
              minLength="6"
            />
          </div>
         
          <button type="submit" className="btn">Registrar</button>
        </form>
      </section>
     
      <section className="card">
        <h2>Usuarios Registrados</h2>
        {users.length === 0 ? (
          <p>No hay usuarios registrados</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Usuario</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
     
      <section className="card">
        <h2>Productos Disponibles</h2>
        {products.length === 0 ? (
          <p>No hay productos disponibles</p>
        ) : (
          <div className="products-grid">
            {products.map(product => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p className="price">${product.price}</p>
                <p className="stock">Stock: {product.stock}</p>
              </div>
            ))}
          </div>
        )}
      </section>
     
      <footer>
        <p>Proyecto de Contenedores Docker - Seguridad en la nube</p>
      </footer>
    </div>
  );
};

export default App;