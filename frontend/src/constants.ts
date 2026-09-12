// Connection URLs with fallbacks
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cin-day-bug-app.onrender.com';
export const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'wss://cin-day-bug-app.onrender.com/ws/leaderboard';

export interface Bug {
  id: string;
  titleDefault: string;
  descriptionDefault: string;
}

export const BUGS: Record<string, Bug> = {
  bug_price: {
    id: "bug_price",
    titleDefault: "Preço Negativo no Moto G Power",
    descriptionDefault: "O Moto G Power está listado no catálogo com um preço negativo de -R$999,00."
  },
  bug_layout: {
    id: "bug_layout",
    titleDefault: "Botão de Checkout Sobreposto",
    descriptionDefault: "O botão principal de checkout no carrinho se sobrepõe ao texto do valor total, tornando-o ilegível."
  },
  bug_loop: {
    id: "bug_loop",
    titleDefault: "Loop de Reinicialização da Quantidade",
    descriptionDefault: "Aumentar a quantidade do produto dentro do carrinho de compras reinicia a quantidade de volta para zero, impedindo a finalização da compra."
  },
  bug_text: {
    id: "bug_text",
    titleDefault: "HTML Bruto Quebrado na Descrição do Razr",
    descriptionDefault: "A descrição do Motorola Razr exibe tags HTML brutas e caracteres corrompidos em vez de texto estilizado."
  },
  bug_filter: {
    id: "bug_filter",
    titleDefault: "Filtro de Categoria com Tela Branca",
    descriptionDefault: "Selecionar o filtro de categoria 'Acessórios' esvazia toda a exibição da loja, mostrando uma página de catálogo completamente em branco."
  },
  bug_image: {
    id: "bug_image",
    titleDefault: "Foto do TurboPower 125W Faltando",
    descriptionDefault: "A imagem do carregador TurboPower 125W está quebrada e falha ao carregar no catálogo da loja."
  }
};

export interface BugMetadata {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  basePoints: number;
  keywords: string[];
}

export const BUG_METADATA: Record<string, BugMetadata> = {
  bug_price: {
    id: "bug_price",
    difficulty: "easy",
    basePoints: 100,
    keywords: ["negative", "price", "minus", "cost", "g power", "value", "subzero", "negativo", "preço", "preco", "menos", "custo", "g power", "valor", "abaixo de zero", "subzero"]
  },
  bug_text: {
    id: "bug_text",
    difficulty: "easy",
    basePoints: 100,
    keywords: ["html", "corrupt", "tag", "code", "razr", "broken", "text", "description", "raw", "corrompido", "corrompida", "tag", "código", "codigo", "razr", "quebrado", "quebrada", "texto", "descrição", "descricao", "cru", "bruto"]
  },
  bug_filter: {
    id: "bug_filter",
    difficulty: "medium",
    basePoints: 250,
    keywords: ["blank", "empty", "filter", "accessory", "accessories", "clear", "disappear", "white", "branco", "vazio", "vazia", "filtro", "acessório", "acessorio", "acessórios", "acessorios", "limpar", "desaparecer", "tela branca"]
  },
  bug_image: {
    id: "bug_image",
    difficulty: "easy",
    basePoints: 100,
    keywords: ["image", "photo", "load", "charger", "broken", "turbopower", "missing", "loading", "pic", "picture", "imagem", "foto", "carregar", "carregador", "quebrado", "quebrada", "turbopower", "faltando", "carregando", "figura", "figuras"]
  },
  bug_loop: {
    id: "bug_loop",
    difficulty: "hard",
    basePoints: 500,
    keywords: ["quantity", "loop", "reset", "zero", "cart", "increment", "increase", "plus", "math", "quantidade", "loop", "resetar", "reiniciar", "zero", "carrinho", "incremento", "incrementar", "aumentar", "mais", "matemática", "matematica"]
  },
  bug_layout: {
    id: "bug_layout",
    difficulty: "hard",
    basePoints: 500,
    keywords: ["overlap", "checkout", "button", "text", "unreadable", "layout", "position", "total", "margin", "sobrepor", "sobreposição", "sobreposicao", "checkout", "botão", "botao", "texto", "ilegível", "ilegivor", "layout", "posição", "posicao", "total", "margem"]
  }
};

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: "premium" | "intermediate" | "accessories";
  description: string;
  specs?: string[];
}

export const PRODUCTS: Product[] = [
  {
    id: "moto_razr",
    name: "Motorola Razr 60",
    price: 999.99,
    originalPrice: 1099.99,
    image: "https://m.media-amazon.com/images/I/61G1x4+IXTL._AC_UF1000,1000_QL80_.jpg",
    category: "premium",
    description: "&lt;div class='text-red-500 font-bold'&gt;&lt;script&gt;alert('corrupted')&lt;/script&gt;&lt;/div&gt; &Aacute;",
    specs: ["12GB RAM", "512GB Armazenamento", "Câmera Dupla de 50MP"]
  },
  {
    id: "moto_edge_pro",
    name: "Motorola Edge 70",
    price: 849.00,
    image: "https://m.media-amazon.com/images/I/615ojDU7zSL.jpg",
    category: "premium",
    description: "Esmaecendo a linha entre arte e tecnologia. Cores certificadas pela Pantone e traseira em couro vegano premium.",
    specs: ["16GB RAM", "1TB Armazenamento", "Zoom Periscópio de 64MP"]
  },
  {
    id: "moto_g_power",
    name: "Moto G75 5G",
    price: -999.00,
    originalPrice: 299.99,
    image: "https://americanas.vtexassets.com/arquivos/ids/30033529/7510905061_1SZ.jpg?v=638840587672730000",
    category: "intermediate",
    description: "Incrível duração de bateria de dois dias com conectividade 5G ultrarrápida. Agora com um lindo acabamento que imita couro.",
    specs: ["8GB RAM", "128GB Armazenamento", "Bateria de 5000mAh"]
  },
  {
    id: "moto_g_stylus",
    name: "Moto G Stylus 5G",
    price: 349.99,
    image: "https://http2.mlstatic.com/D_NQ_NP_808444-CBT113517505813_062026-O.webp",
    category: "intermediate",
    description: "Expresse sua criatividade com a caneta stylus integrada. Perfeito para anotações rápidas, edições de precisão e navegação contínua.",
    specs: ["8GB RAM", "256GB Armazenamento", "Caneta Stylus Integrada"]
  },
  {
    id: "moto_buds",
    name: "Moto Buds+ (Som Bose)",
    price: 129.99,
    image: "https://m.media-amazon.com/images/I/61Air9l4A2L._AC_UF1000,1000_QL80_.jpg",
    category: "accessories",
    description: "Fones de ouvido premium criados em parceria com a Bose. Áudio de alta resolução com Cancelamento Ativo de Ruído e suporte a Dolby Atmos.",
    specs: ["Ajuste de Som Bose", "Áudio de Alta Resolução", "Rastreamento Dolby Atmos"]
  },
  {
    id: "moto_charger",
    name: "Carregador TurboPower 125W",
    price: 59.99,
    image: "https://images.unsplash.com/broken-photo-turbopower-125w-invalid-url-force-error",
    category: "accessories",
    description: "Velocidades de carregamento inacreditavelmente rápidas. Carrega seu dispositivo Motorola compatível de 0% a 100% em menos de 20 minutos.",
    specs: ["Saída Máxima de 125W", "USB-C PD 3.0", "Proteção Contra Superaquecimento"]
  }
];
