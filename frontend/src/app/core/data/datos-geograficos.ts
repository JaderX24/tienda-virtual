// Datos de referencia geográficos (ISO 3166 + ITU-T E.164)
// TODO: Migrar a catálogo con metadata cuando el modelo Catalogo soporte campos adicionales

export interface PaisReferencia {
    codigo: string;
    nombre: string;
    bandera: string;
}

export interface CodigoTelefonicoPais {
    codigo: string;
    pais: string;
    bandera: string;
    formato: string;
    digitos: number;
}

export const PAISES_REFERENCIA: PaisReferencia[] = [
    { codigo: 'HN', nombre: 'Honduras', bandera: '🇭🇳' },
    { codigo: 'US', nombre: 'Estados Unidos', bandera: '🇺🇸' },
    { codigo: 'CA', nombre: 'Canadá', bandera: '🇨🇦' },
    { codigo: 'MX', nombre: 'México', bandera: '🇲🇽' },
    { codigo: 'GT', nombre: 'Guatemala', bandera: '🇬🇹' },
    { codigo: 'SV', nombre: 'El Salvador', bandera: '🇸🇻' },
    { codigo: 'NI', nombre: 'Nicaragua', bandera: '🇳🇮' },
    { codigo: 'CR', nombre: 'Costa Rica', bandera: '🇨🇷' },
    { codigo: 'PA', nombre: 'Panamá', bandera: '🇵🇦' },
    { codigo: 'CO', nombre: 'Colombia', bandera: '🇨🇴' },
    { codigo: 'PE', nombre: 'Perú', bandera: '🇵🇪' },
    { codigo: 'CL', nombre: 'Chile', bandera: '🇨🇱' },
    { codigo: 'AR', nombre: 'Argentina', bandera: '🇦🇷' },
    { codigo: 'VE', nombre: 'Venezuela', bandera: '🇻🇪' },
    { codigo: 'EC', nombre: 'Ecuador', bandera: '🇪🇨' },
    { codigo: 'BO', nombre: 'Bolivia', bandera: '🇧🇴' },
    { codigo: 'PY', nombre: 'Paraguay', bandera: '🇵🇾' },
    { codigo: 'UY', nombre: 'Uruguay', bandera: '🇺🇾' },
    { codigo: 'BR', nombre: 'Brasil', bandera: '🇧🇷' },
    { codigo: 'ES', nombre: 'España', bandera: '🇪🇸' },
    { codigo: 'DE', nombre: 'Alemania', bandera: '🇩🇪' },
    { codigo: 'FR', nombre: 'Francia', bandera: '🇫🇷' },
    { codigo: 'GB', nombre: 'Reino Unido', bandera: '🇬🇧' },
    { codigo: 'IT', nombre: 'Italia', bandera: '🇮🇹' },
    { codigo: 'PT', nombre: 'Portugal', bandera: '🇵🇹' },
    { codigo: 'NL', nombre: 'Países Bajos', bandera: '🇳🇱' },
    { codigo: 'BE', nombre: 'Bélgica', bandera: '🇧🇪' },
    { codigo: 'CH', nombre: 'Suiza', bandera: '🇨🇭' },
    { codigo: 'AT', nombre: 'Austria', bandera: '🇦🇹' },
    { codigo: 'CN', nombre: 'China', bandera: '🇨🇳' },
    { codigo: 'JP', nombre: 'Japón', bandera: '🇯🇵' },
    { codigo: 'KR', nombre: 'Corea del Sur', bandera: '🇰🇷' },
    { codigo: 'IN', nombre: 'India', bandera: '🇮🇳' },
    { codigo: 'AU', nombre: 'Australia', bandera: '🇦🇺' },
    { codigo: 'NZ', nombre: 'Nueva Zelanda', bandera: '🇳🇿' },
];

export const ESTADOS_POR_PAIS: Record<string, string[]> = {
    'HN': ['Atlántida', 'Choluteca', 'Colón', 'Comayagua', 'Copán', 'Cortés', 'El Paraíso', 'Francisco Morazán', 'Gracias a Dios', 'Intibucá', 'Islas de la Bahía', 'La Paz', 'Lempira', 'Ocotepeque', 'Olancho', 'Santa Bárbara', 'Valle', 'Yoro'],
    'US': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    'CA': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Nova Scotia', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan'],
    'MX': ['Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima', 'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'],
    'GT': ['Alta Verapaz', 'Baja Verapaz', 'Chimaltenango', 'Chiquimula', 'El Progreso', 'Escuintla', 'Guatemala', 'Huehuetenango', 'Izabal', 'Jalapa', 'Jutiapa', 'Petén', 'Quetzaltenango', 'Quiché', 'Retalhuleu', 'Sacatepéquez', 'San Marcos', 'Santa Rosa', 'Sololá', 'Suchitepéquez', 'Totonicapán', 'Zacapa'],
    'SV': ['Ahuachapán', 'Cabañas', 'Chalatenango', 'Cuscatlán', 'La Libertad', 'La Paz', 'La Unión', 'Morazán', 'San Miguel', 'San Salvador', 'San Vicente', 'Santa Ana', 'Sonsonate', 'Usulután'],
    'NI': ['Boaco', 'Carazo', 'Chinandega', 'Chontales', 'Estelí', 'Granada', 'Jinotega', 'León', 'Madriz', 'Managua', 'Masaya', 'Matagalpa', 'Nueva Segovia', 'Río San Juan', 'Rivas'],
    'CR': ['Alajuela', 'Cartago', 'Guanacaste', 'Heredia', 'Limón', 'Puntarenas', 'San José'],
    'PA': ['Bocas del Toro', 'Chiriquí', 'Coclé', 'Colón', 'Darién', 'Herrera', 'Los Santos', 'Panamá', 'Panamá Oeste', 'Veraguas'],
    'CO': ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'],
    'ES': ['Andalucía', 'Aragón', 'Asturias', 'Baleares', 'Canarias', 'Cantabria', 'Castilla y León', 'Castilla-La Mancha', 'Cataluña', 'Comunidad Valenciana', 'Extremadura', 'Galicia', 'La Rioja', 'Madrid', 'Murcia', 'Navarra', 'País Vasco'],
    'AR': ['Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Ciudad de Buenos Aires', 'Córdoba', 'Corrientes', 'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'],
    'CL': ['Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso', 'Metropolitana de Santiago', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos', 'Los Lagos', 'Aysén', 'Magallanes'],
    'PE': ['Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho', 'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco', 'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima', 'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura', 'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'],
    'BR': ['Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'],
};

export const CODIGOS_TELEFONICOS: CodigoTelefonicoPais[] = [
    { codigo: '+504', pais: 'Honduras', bandera: '🇭🇳', formato: '####-####', digitos: 8 },
    { codigo: '+1', pais: 'Estados Unidos', bandera: '🇺🇸', formato: '(###) ###-####', digitos: 10 },
    { codigo: '+1', pais: 'Canadá', bandera: '🇨🇦', formato: '(###) ###-####', digitos: 10 },
    { codigo: '+52', pais: 'México', bandera: '🇲🇽', formato: '## #### ####', digitos: 10 },
    { codigo: '+502', pais: 'Guatemala', bandera: '🇬🇹', formato: '####-####', digitos: 8 },
    { codigo: '+503', pais: 'El Salvador', bandera: '🇸🇻', formato: '####-####', digitos: 8 },
    { codigo: '+505', pais: 'Nicaragua', bandera: '🇳🇮', formato: '####-####', digitos: 8 },
    { codigo: '+506', pais: 'Costa Rica', bandera: '🇨🇷', formato: '####-####', digitos: 8 },
    { codigo: '+507', pais: 'Panamá', bandera: '🇵🇦', formato: '####-####', digitos: 8 },
    { codigo: '+57', pais: 'Colombia', bandera: '🇨🇴', formato: '### ### ####', digitos: 10 },
    { codigo: '+51', pais: 'Perú', bandera: '🇵🇪', formato: '### ### ###', digitos: 9 },
    { codigo: '+56', pais: 'Chile', bandera: '🇨🇱', formato: '# #### ####', digitos: 9 },
    { codigo: '+54', pais: 'Argentina', bandera: '🇦🇷', formato: '## ####-####', digitos: 10 },
    { codigo: '+58', pais: 'Venezuela', bandera: '🇻🇪', formato: '###-###-####', digitos: 10 },
    { codigo: '+593', pais: 'Ecuador', bandera: '🇪🇨', formato: '## ###-####', digitos: 9 },
    { codigo: '+591', pais: 'Bolivia', bandera: '🇧🇴', formato: '########', digitos: 8 },
    { codigo: '+595', pais: 'Paraguay', bandera: '🇵🇾', formato: '### ######', digitos: 9 },
    { codigo: '+598', pais: 'Uruguay', bandera: '🇺🇾', formato: '## ### ###', digitos: 8 },
    { codigo: '+55', pais: 'Brasil', bandera: '🇧🇷', formato: '## #####-####', digitos: 11 },
    { codigo: '+34', pais: 'España', bandera: '🇪🇸', formato: '### ## ## ##', digitos: 9 },
    { codigo: '+49', pais: 'Alemania', bandera: '🇩🇪', formato: '### ########', digitos: 11 },
    { codigo: '+33', pais: 'Francia', bandera: '🇫🇷', formato: '# ## ## ## ##', digitos: 9 },
    { codigo: '+44', pais: 'Reino Unido', bandera: '🇬🇧', formato: '#### ######', digitos: 10 },
    { codigo: '+39', pais: 'Italia', bandera: '🇮🇹', formato: '### ### ####', digitos: 10 },
    { codigo: '+86', pais: 'China', bandera: '🇨🇳', formato: '### #### ####', digitos: 11 },
    { codigo: '+81', pais: 'Japón', bandera: '🇯🇵', formato: '##-####-####', digitos: 10 },
    { codigo: '+82', pais: 'Corea del Sur', bandera: '🇰🇷', formato: '##-####-####', digitos: 10 },
    { codigo: '+91', pais: 'India', bandera: '🇮🇳', formato: '##### #####', digitos: 10 },
];
