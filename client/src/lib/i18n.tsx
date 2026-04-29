import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "pt-BR" | "es";

type TranslationKey =
  | "common.language"
  | "common.portuguese"
  | "common.spanish"
  | "common.theme"
  | "common.logout"
  | "common.actions"
  | "common.edit"
  | "common.delete"
  | "common.back"
  | "layout.adminPanel"
  | "layout.dashboard"
  | "layout.clients"
  | "layout.drivers"
  | "layout.vehicles"
  | "layout.services"
  | "layout.agenda"
  | "layout.reports"
  | "layout.history"
  | "layout.finance"
  | "layout.expenses"
  | "layout.revenues"
  | "layout.financeReports"
  | "layout.financeAgenda"
  | "layout.financeDashboard"
  | "login.welcome"
  | "login.subtitle"
  | "login.email"
  | "login.password"
  | "login.enter"
  | "login.entering"
  | "login.firstAccess"
  | "login.forgotPassword"
  | "login.loginErrorTitle"
  | "login.loginErrorDescription"
  | "login.heroTitle"
  | "login.heroSubtitle"
  | "login.forgotTitle"
  | "login.forgotRegisteredEmail"
  | "login.forgotContinue"
  | "login.forgotEmailFoundTitle"
  | "login.forgotEmailFoundDescription"
  | "login.forgotCheckEmailError"
  | "login.forgotInvalidPasswordTitle"
  | "login.forgotInvalidPasswordDescription"
  | "login.forgotResetError"
  | "login.forgotPasswordUpdatedTitle"
  | "login.forgotPasswordUpdatedDescription"
  | "login.forgotNewPassword"
  | "login.forgotConfirmPassword"
  | "login.forgotMinChars"
  | "login.forgotResetAction"
  | "login.helpLine1"
  | "login.helpLine2"
  | "dashboard.title"
  | "dashboard.subtitle"
  | "dashboard.todayServices"
  | "dashboard.estimatedRevenueToday"
  | "dashboard.activeDrivers"
  | "dashboard.availableVehicles"
  | "dashboard.quickActions"
  | "dashboard.priorityShortcuts"
  | "clients.title"
  | "clients.subtitle"
  | "clients.add"
  | "clients.edit"
  | "clients.update"
  | "clients.create"
  | "clients.loading"
  | "clients.empty"
  | "clients.historyTitle"
  | "drivers.title"
  | "drivers.subtitle"
  | "drivers.add"
  | "drivers.edit"
  | "drivers.update"
  | "drivers.create"
  | "drivers.loading"
  | "drivers.empty"
  | "vehicles.title"
  | "vehicles.subtitle"
  | "vehicles.add"
  | "vehicles.edit"
  | "vehicles.update"
  | "vehicles.create"
  | "vehicles.loading"
  | "vehicles.empty"
  | "services.editTitle"
  | "services.newTitle"
  | "services.title"
  | "services.new"
  | "services.loading"
  | "services.empty"
  | "agenda.title"
  | "agenda.subtitle"
  | "agenda.summary"
  | "agenda.loading"
  | "agenda.empty"
  | "settings.title"
  | "settings.subtitle"
  | "settings.accessDeniedTitle"
  | "settings.accessDeniedText"
  | "reports.title"
  | "reports.subtitle"
  | "reports.print"
  | "reports.exportCsv"
  | "financeDashboard.title"
  | "financeReports.title"
  | "financeReports.subtitle"
  | "finance.common.filters"
  | "finance.common.hideFilters"
  | "finance.common.exportCsv"
  | "finance.common.exportExcel"
  | "finance.common.exportPdf"
  | "finance.common.loading"
  | "financeRevenues.title"
  | "financeRevenues.subtitle"
  | "financeRevenues.add"
  | "financeRevenues.period"
  | "financeExpensesList.title"
  | "financeExpensesList.subtitle"
  | "financeExpensesList.add"
  | "financeExpensesList.list"
  | "financeExpensesCreate.title"
  | "financeExpensesCreate.subtitle"
  | "financeAgenda.title"
  | "financeAgenda.subtitle"
  | "financeAgenda.period"
  | "financeAgenda.expenseAgenda"
  | "financeKm.title"
  | "financeKm.subtitle"
  | "financeKm.register"
  | "financeKm.list"
  | "financeServiceDetail.title"
  | "financeServiceDetail.subtitle"
  | "driverHistory.title"
  | "driverHistory.subtitle"
  | "driverHistory.loading"
  | "driverHistory.empty"
  | "notFound.title"
  | "notFound.subtitle"
  | "registerInvite.invalidTitle"
  | "registerInvite.invalidSubtitle"
  | "registerInvite.welcomeTitle"
  | "registerInvite.welcomeSubtitle"
  | "registerInvite.createAccount"
  | "registerInvite.creatingAccount"
  | "registerSetup.title"
  | "registerSetup.subtitle"
  | "registerSetup.registerPassword"
  | "registerSetup.registering"
  | "registerSetup.login";

type TranslationMap = Record<TranslationKey, string>;

const ptBR: TranslationMap = {
  "common.language": "Idioma",
  "common.portuguese": "Portugues",
  "common.spanish": "Espanhol",
  "common.theme": "Tema",
  "common.logout": "Sair",
  "common.actions": "Acoes",
  "common.edit": "Editar",
  "common.delete": "Excluir",
  "common.back": "Voltar",
  "layout.adminPanel": "Painel Administrativo",
  "layout.dashboard": "Painel",
  "layout.clients": "Clientes",
  "layout.drivers": "Motoristas",
  "layout.vehicles": "Veiculos",
  "layout.services": "Servicos",
  "layout.agenda": "Agenda",
  "layout.reports": "Relatorios",
  "layout.history": "Historico",
  "layout.finance": "Financeiro",
  "layout.expenses": "Despesas",
  "layout.revenues": "Receitas",
  "layout.financeReports": "Relatorios",
  "layout.financeAgenda": "Agenda",
  "layout.financeDashboard": "Painel Financeiro",
  "login.welcome": "Bem-vindo",
  "login.subtitle": "Faca login para acessar seu painel.",
  "login.email": "E-mail",
  "login.password": "Senha",
  "login.enter": "Entrar",
  "login.entering": "Entrando...",
  "login.firstAccess": "Primeiro Acesso? Cadastre sua senha",
  "login.forgotPassword": "Esqueci minha senha",
  "login.loginErrorTitle": "Erro",
  "login.loginErrorDescription": "Falha no login",
  "login.heroTitle": "Gestao de Frota Premium.",
  "login.heroSubtitle": "Gerencie motoristas, veiculos e clientes premium com precisao e elegancia. O painel completo para servicos de transporte executivo.",
  "login.forgotTitle": "Recuperar senha",
  "login.forgotRegisteredEmail": "E-mail cadastrado",
  "login.forgotContinue": "Continuar",
  "login.forgotEmailFoundTitle": "E-mail localizado",
  "login.forgotEmailFoundDescription": "Defina sua nova senha.",
  "login.forgotCheckEmailError": "E-mail nao encontrado",
  "login.forgotInvalidPasswordTitle": "Senha invalida",
  "login.forgotInvalidPasswordDescription": "As senhas devem coincidir e ter ao menos 6 caracteres.",
  "login.forgotResetError": "Falha ao redefinir senha",
  "login.forgotPasswordUpdatedTitle": "Senha atualizada",
  "login.forgotPasswordUpdatedDescription": "Sua senha foi redefinida. Realize o login.",
  "login.forgotNewPassword": "Nova senha",
  "login.forgotConfirmPassword": "Confirmar senha",
  "login.forgotMinChars": "min. 6 caracteres",
  "login.forgotResetAction": "Redefinir senha",
  "login.helpLine1": "Use seu e-mail e senha cadastrados.",
  "login.helpLine2": "Em caso de duvida, contate o administrador.",
  "dashboard.title": "Painel",
  "dashboard.subtitle": "Visao geral das operacoes de hoje.",
  "dashboard.todayServices": "Servicos de Hoje",
  "dashboard.estimatedRevenueToday": "Receita Estimada (Hoje)",
  "dashboard.activeDrivers": "Motoristas Ativos",
  "dashboard.availableVehicles": "Veiculos Disponiveis",
  "dashboard.quickActions": "Acoes Rapidas",
  "dashboard.priorityShortcuts": "Atalhos prioritarios para as principais utilidades do sistema.",
  "clients.title": "Clientes",
  "clients.subtitle": "Cadastre e gerencie seus clientes.",
  "clients.add": "Adicionar Cliente",
  "clients.edit": "Editar Cliente",
  "clients.update": "Atualizar Cliente",
  "clients.create": "Criar Cliente",
  "clients.loading": "Carregando clientes...",
  "clients.empty": "Nenhum cliente encontrado.",
  "clients.historyTitle": "Historico de corridas do cliente",
  "drivers.title": "Motoristas",
  "drivers.subtitle": "Gerencie a equipe de motoristas.",
  "drivers.add": "Adicionar Motorista",
  "drivers.edit": "Editar Motorista",
  "drivers.update": "Atualizar Motorista",
  "drivers.create": "Criar Motorista",
  "drivers.loading": "Carregando motoristas...",
  "drivers.empty": "Nenhum motorista encontrado.",
  "vehicles.title": "Veiculos",
  "vehicles.subtitle": "Gerencie sua frota.",
  "vehicles.add": "Adicionar Veiculo",
  "vehicles.edit": "Editar Veiculo",
  "vehicles.update": "Atualizar Veiculo",
  "vehicles.create": "Criar Veiculo",
  "vehicles.loading": "Carregando veiculos...",
  "vehicles.empty": "Nenhum veiculo encontrado.",
  "services.editTitle": "Editar Servico",
  "services.newTitle": "Novo Servico",
  "services.title": "Servicos",
  "services.new": "Novo Servico",
  "services.loading": "Carregando servicos...",
  "services.empty": "Nenhum servico encontrado.",
  "agenda.title": "Agenda Operacional",
  "agenda.subtitle": "Agenda e cronograma diario.",
  "agenda.summary": "Resumo",
  "agenda.loading": "Carregando agenda...",
  "agenda.empty": "Nenhum servico agendado para este dia.",
  "settings.title": "Configuracoes",
  "settings.subtitle": "Gerencie usuarios e permissoes do sistema.",
  "settings.accessDeniedTitle": "Acesso Negado",
  "settings.accessDeniedText": "Voce nao tem permissao para acessar esta pagina.",
  "reports.title": "Relatorios Financeiros de Servicos",
  "reports.subtitle": "Analise de receita e servicos.",
  "reports.print": "Imprimir",
  "reports.exportCsv": "Exportar CSV",
  "financeDashboard.title": "Dashboard Financeiro",
  "financeReports.title": "Relatorios Financeiros",
  "financeReports.subtitle": "Resumo por periodo com custo medio por km.",
  "finance.common.filters": "Filtros",
  "finance.common.hideFilters": "Ocultar filtros",
  "finance.common.exportCsv": "Exportar CSV",
  "finance.common.exportExcel": "Exportar Excel",
  "finance.common.exportPdf": "Exportar PDF",
  "finance.common.loading": "Carregando...",
  "financeRevenues.title": "Receitas",
  "financeRevenues.subtitle": "Entradas financeiras por servicos, outras origens e creditos de clientes.",
  "financeRevenues.add": "Adicionar Receita",
  "financeRevenues.period": "Receitas no Periodo",
  "financeExpensesList.title": "Central de Despesas",
  "financeExpensesList.subtitle": "Cadastro e listagem unificada de todas as despesas.",
  "financeExpensesList.add": "Cadastrar Despesa",
  "financeExpensesList.list": "Listagem Unificada",
  "financeExpensesCreate.title": "Cadastro de Despesas",
  "financeExpensesCreate.subtitle": "Registre despesas de viagem, veiculo e gerais.",
  "financeAgenda.title": "Agenda Financeira",
  "financeAgenda.subtitle": "Exibe despesas pelo periodo selecionado.",
  "financeAgenda.period": "Periodo",
  "financeAgenda.expenseAgenda": "Agenda de despesas",
  "financeKm.title": "Logs de KM de Veiculo",
  "financeKm.subtitle": "Registro de odometro por veiculo e servico.",
  "financeKm.register": "Registrar Log",
  "financeKm.list": "Listagem",
  "financeServiceDetail.title": "Detalhe Financeiro da Viagem",
  "financeServiceDetail.subtitle": "Resumo financeiro com indicador de prejuizo.",
  "driverHistory.title": "Historico de Viagens",
  "driverHistory.subtitle": "Todas as viagens vinculadas ao motorista.",
  "driverHistory.loading": "Carregando...",
  "driverHistory.empty": "Nenhuma viagem encontrada.",
  "notFound.title": "404 Pagina Nao Encontrada",
  "notFound.subtitle": "Voce esqueceu de adicionar a pagina ao roteador?",
  "registerInvite.invalidTitle": "Convite Invalido",
  "registerInvite.invalidSubtitle": "O link que voce acessou e invalido ou expirou.",
  "registerInvite.welcomeTitle": "Bem-vindo(a) a VBM Transfer",
  "registerInvite.welcomeSubtitle": "Complete seu cadastro para acessar o sistema.",
  "registerInvite.createAccount": "Criar Conta",
  "registerInvite.creatingAccount": "Criando conta...",
  "registerSetup.title": "Primeiro Acesso",
  "registerSetup.subtitle": "Informe seu email cadastrado e defina sua senha de acesso",
  "registerSetup.registerPassword": "Registrar Senha",
  "registerSetup.registering": "Registrando...",
  "registerSetup.login": "Fazer Login",
};

const es: TranslationMap = {
  "common.language": "Idioma",
  "common.portuguese": "Portugues",
  "common.spanish": "Espanol",
  "common.theme": "Tema",
  "common.logout": "Salir",
  "common.actions": "Acciones",
  "common.edit": "Editar",
  "common.delete": "Eliminar",
  "common.back": "Volver",
  "layout.adminPanel": "Panel Administrativo",
  "layout.dashboard": "Panel",
  "layout.clients": "Clientes",
  "layout.drivers": "Conductores",
  "layout.vehicles": "Vehiculos",
  "layout.services": "Servicios",
  "layout.agenda": "Agenda",
  "layout.reports": "Reportes",
  "layout.history": "Historial",
  "layout.finance": "Finanzas",
  "layout.expenses": "Gastos",
  "layout.revenues": "Ingresos",
  "layout.financeReports": "Reportes",
  "layout.financeAgenda": "Agenda",
  "layout.financeDashboard": "Panel Financiero",
  "login.welcome": "Bienvenido",
  "login.subtitle": "Inicia sesion para acceder a tu panel.",
  "login.email": "Correo",
  "login.password": "Contrasena",
  "login.enter": "Entrar",
  "login.entering": "Ingresando...",
  "login.firstAccess": "Primer acceso? Crea tu contrasena",
  "login.forgotPassword": "Olvide mi contrasena",
  "login.loginErrorTitle": "Error",
  "login.loginErrorDescription": "Fallo en el inicio de sesion",
  "login.heroTitle": "Gestion de Flota Premium.",
  "login.heroSubtitle": "Gestiona conductores, vehiculos y clientes premium con precision y elegancia. El panel completo para servicios de transporte ejecutivo.",
  "login.forgotTitle": "Recuperar contrasena",
  "login.forgotRegisteredEmail": "Correo registrado",
  "login.forgotContinue": "Continuar",
  "login.forgotEmailFoundTitle": "Correo localizado",
  "login.forgotEmailFoundDescription": "Define tu nueva contrasena.",
  "login.forgotCheckEmailError": "Correo no encontrado",
  "login.forgotInvalidPasswordTitle": "Contrasena invalida",
  "login.forgotInvalidPasswordDescription": "Las contrasenas deben coincidir y tener al menos 6 caracteres.",
  "login.forgotResetError": "Fallo al restablecer la contrasena",
  "login.forgotPasswordUpdatedTitle": "Contrasena actualizada",
  "login.forgotPasswordUpdatedDescription": "Tu contrasena fue restablecida. Inicia sesion.",
  "login.forgotNewPassword": "Nueva contrasena",
  "login.forgotConfirmPassword": "Confirmar contrasena",
  "login.forgotMinChars": "min. 6 caracteres",
  "login.forgotResetAction": "Restablecer contrasena",
  "login.helpLine1": "Usa tu correo y contrasena registrados.",
  "login.helpLine2": "Si tienes dudas, contacta al administrador.",
  "dashboard.title": "Panel",
  "dashboard.subtitle": "Vision general de las operaciones de hoy.",
  "dashboard.todayServices": "Servicios de Hoy",
  "dashboard.estimatedRevenueToday": "Ingresos Estimados (Hoy)",
  "dashboard.activeDrivers": "Conductores Activos",
  "dashboard.availableVehicles": "Vehiculos Disponibles",
  "dashboard.quickActions": "Acciones Rapidas",
  "dashboard.priorityShortcuts": "Atajos prioritarios para las principales utilidades del sistema.",
  "clients.title": "Clientes",
  "clients.subtitle": "Registra y gestiona tus clientes.",
  "clients.add": "Agregar Cliente",
  "clients.edit": "Editar Cliente",
  "clients.update": "Actualizar Cliente",
  "clients.create": "Crear Cliente",
  "clients.loading": "Cargando clientes...",
  "clients.empty": "Ningun cliente encontrado.",
  "clients.historyTitle": "Historial de viajes del cliente",
  "drivers.title": "Conductores",
  "drivers.subtitle": "Gestiona el equipo de conductores.",
  "drivers.add": "Agregar Conductor",
  "drivers.edit": "Editar Conductor",
  "drivers.update": "Actualizar Conductor",
  "drivers.create": "Crear Conductor",
  "drivers.loading": "Cargando conductores...",
  "drivers.empty": "Ningun conductor encontrado.",
  "vehicles.title": "Vehiculos",
  "vehicles.subtitle": "Gestiona tu flota.",
  "vehicles.add": "Agregar Vehiculo",
  "vehicles.edit": "Editar Vehiculo",
  "vehicles.update": "Actualizar Vehiculo",
  "vehicles.create": "Crear Vehiculo",
  "vehicles.loading": "Cargando vehiculos...",
  "vehicles.empty": "Ningun vehiculo encontrado.",
  "services.editTitle": "Editar Servicio",
  "services.newTitle": "Nuevo Servicio",
  "services.title": "Servicios",
  "services.new": "Nuevo Servicio",
  "services.loading": "Cargando servicios...",
  "services.empty": "Ningun servicio encontrado.",
  "agenda.title": "Agenda Operativa",
  "agenda.subtitle": "Agenda y cronograma diario.",
  "agenda.summary": "Resumen",
  "agenda.loading": "Cargando agenda...",
  "agenda.empty": "No hay servicios programados para este dia.",
  "settings.title": "Configuraciones",
  "settings.subtitle": "Gestiona usuarios y permisos del sistema.",
  "settings.accessDeniedTitle": "Acceso Denegado",
  "settings.accessDeniedText": "No tienes permiso para acceder a esta pagina.",
  "reports.title": "Reportes Financieros de Servicios",
  "reports.subtitle": "Analisis de ingresos y servicios.",
  "reports.print": "Imprimir",
  "reports.exportCsv": "Exportar CSV",
  "financeDashboard.title": "Panel Financiero",
  "financeReports.title": "Reportes Financieros",
  "financeReports.subtitle": "Resumen por periodo con costo medio por km.",
  "finance.common.filters": "Filtros",
  "finance.common.hideFilters": "Ocultar filtros",
  "finance.common.exportCsv": "Exportar CSV",
  "finance.common.exportExcel": "Exportar Excel",
  "finance.common.exportPdf": "Exportar PDF",
  "finance.common.loading": "Cargando...",
  "financeRevenues.title": "Ingresos",
  "financeRevenues.subtitle": "Entradas financieras por servicios, otros origenes y creditos de clientes.",
  "financeRevenues.add": "Agregar Ingreso",
  "financeRevenues.period": "Ingresos en el Periodo",
  "financeExpensesList.title": "Central de Gastos",
  "financeExpensesList.subtitle": "Registro y listado unificado de todos los gastos.",
  "financeExpensesList.add": "Registrar Gasto",
  "financeExpensesList.list": "Listado Unificado",
  "financeExpensesCreate.title": "Registro de Gastos",
  "financeExpensesCreate.subtitle": "Registra gastos de viaje, vehiculo y generales.",
  "financeAgenda.title": "Agenda Financiera",
  "financeAgenda.subtitle": "Muestra gastos por el periodo seleccionado.",
  "financeAgenda.period": "Periodo",
  "financeAgenda.expenseAgenda": "Agenda de gastos",
  "financeKm.title": "Registros de KM de Vehiculo",
  "financeKm.subtitle": "Registro de odometro por vehiculo y servicio.",
  "financeKm.register": "Registrar",
  "financeKm.list": "Listado",
  "financeServiceDetail.title": "Detalle Financiero del Viaje",
  "financeServiceDetail.subtitle": "Resumen financiero con indicador de perdida.",
  "driverHistory.title": "Historial de Viajes",
  "driverHistory.subtitle": "Todos los viajes vinculados al conductor.",
  "driverHistory.loading": "Cargando...",
  "driverHistory.empty": "Ningun viaje encontrado.",
  "notFound.title": "404 Pagina No Encontrada",
  "notFound.subtitle": "Olvidaste agregar la pagina al enrutador?",
  "registerInvite.invalidTitle": "Invitacion Invalida",
  "registerInvite.invalidSubtitle": "El enlace al que accediste es invalido o expiro.",
  "registerInvite.welcomeTitle": "Bienvenido(a) a VBM Transfer",
  "registerInvite.welcomeSubtitle": "Completa tu registro para acceder al sistema.",
  "registerInvite.createAccount": "Crear Cuenta",
  "registerInvite.creatingAccount": "Creando cuenta...",
  "registerSetup.title": "Primer Acceso",
  "registerSetup.subtitle": "Ingresa tu correo registrado y define tu contrasena de acceso",
  "registerSetup.registerPassword": "Registrar Contrasena",
  "registerSetup.registering": "Registrando...",
  "registerSetup.login": "Iniciar Sesion",
};

const translations: Record<AppLanguage, TranslationMap> = {
  "pt-BR": ptBR,
  es,
};

type I18nContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  t: (key: TranslationKey) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

const LANGUAGE_STORAGE_KEY = "vbm_language";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window === "undefined") return "pt-BR";
    const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return saved === "es" ? "es" : "pt-BR";
  });

  useEffect(() => {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language === "es" ? "es" : "pt-BR";
  }, [language]);

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      setLanguage: setLanguageState,
      t: (key) => translations[language][key] || key,
    };
  }, [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside I18nProvider");
  }
  return ctx;
}
