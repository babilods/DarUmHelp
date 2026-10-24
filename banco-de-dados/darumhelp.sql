-- MySQL dump 10.13  Distrib 8.0.46, for Linux (x86_64)
--
-- Host: localhost    Database: darumhelp
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agendamento_agendamento`
--

DROP TABLE IF EXISTS `agendamento_agendamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamento_agendamento` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `data` date NOT NULL,
  `horario` time(6) NOT NULL,
  `conteudo` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `aluno_id` bigint NOT NULL,
  `disciplina_id` bigint NOT NULL,
  `disponibilidade_id` bigint NOT NULL,
  `professor_id` bigint NOT NULL,
  `cancelado_em` datetime(6) DEFAULT NULL,
  `cancelado_por_id` int DEFAULT NULL,
  `motivo_cancelamento` varchar(30) NOT NULL,
  `duracao_minutos` smallint unsigned NOT NULL,
  `chat_lido_aluno_em` datetime(6) DEFAULT NULL,
  `chat_lido_professor_em` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `agendamento_agendame_aluno_id_078b3bf6_fk_contas_pe` (`aluno_id`),
  KEY `agendamento_agendame_disciplina_id_6931f81d_fk_professor` (`disciplina_id`),
  KEY `agendamento_agendame_disponibilidade_id_5de92930_fk_professor` (`disponibilidade_id`),
  KEY `agendamento_agendame_professor_id_86915e15_fk_contas_pe` (`professor_id`),
  KEY `agendamento_agendame_cancelado_por_id_c76262e2_fk_auth_user` (`cancelado_por_id`),
  CONSTRAINT `agendamento_agendame_aluno_id_078b3bf6_fk_contas_pe` FOREIGN KEY (`aluno_id`) REFERENCES `contas_perfilaluno` (`id`),
  CONSTRAINT `agendamento_agendame_cancelado_por_id_c76262e2_fk_auth_user` FOREIGN KEY (`cancelado_por_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `agendamento_agendame_disciplina_id_6931f81d_fk_professor` FOREIGN KEY (`disciplina_id`) REFERENCES `professores_disciplina` (`id`),
  CONSTRAINT `agendamento_agendame_disponibilidade_id_5de92930_fk_professor` FOREIGN KEY (`disponibilidade_id`) REFERENCES `professores_disponibilidade` (`id`),
  CONSTRAINT `agendamento_agendame_professor_id_86915e15_fk_contas_pe` FOREIGN KEY (`professor_id`) REFERENCES `contas_perfilprofessor` (`id`),
  CONSTRAINT `agendamento_agendamento_chk_1` CHECK ((`duracao_minutos` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `agendamento_avaliacao`
--

DROP TABLE IF EXISTS `agendamento_avaliacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamento_avaliacao` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nota` smallint unsigned NOT NULL,
  `comentario` longtext NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `agendamento_id` bigint NOT NULL,
  `aluno_id` bigint NOT NULL,
  `professor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agendamento_id` (`agendamento_id`),
  KEY `agendamento_avaliacao_aluno_id_0ae52b64_fk_contas_perfilaluno_id` (`aluno_id`),
  KEY `agendamento_avaliaca_professor_id_57474fa6_fk_contas_pe` (`professor_id`),
  CONSTRAINT `agendamento_avaliaca_agendamento_id_b6ec10ab_fk_agendamen` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamento_agendamento` (`id`),
  CONSTRAINT `agendamento_avaliaca_professor_id_57474fa6_fk_contas_pe` FOREIGN KEY (`professor_id`) REFERENCES `contas_perfilprofessor` (`id`),
  CONSTRAINT `agendamento_avaliacao_aluno_id_0ae52b64_fk_contas_perfilaluno_id` FOREIGN KEY (`aluno_id`) REFERENCES `contas_perfilaluno` (`id`),
  CONSTRAINT `agendamento_avaliacao_chk_1` CHECK ((`nota` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `agendamento_denunciamensagem`
--

DROP TABLE IF EXISTS `agendamento_denunciamensagem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamento_denunciamensagem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `texto_mensagem_snapshot` longtext NOT NULL,
  `motivo` varchar(30) NOT NULL,
  `detalhes` longtext NOT NULL,
  `status` varchar(20) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `resolvido_em` datetime(6) DEFAULT NULL,
  `agendamento_id` bigint NOT NULL,
  `denunciado_id` int DEFAULT NULL,
  `denunciante_id` int DEFAULT NULL,
  `mensagem_id` bigint DEFAULT NULL,
  `resolvido_por_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `agendamento_denuncia_agendamento_id_fe050d5e_fk_agendamen` (`agendamento_id`),
  KEY `agendamento_denuncia_denunciado_id_83d2a9bd_fk_auth_user` (`denunciado_id`),
  KEY `agendamento_denuncia_denunciante_id_3b8c7146_fk_auth_user` (`denunciante_id`),
  KEY `agendamento_denuncia_mensagem_id_48c94911_fk_agendamen` (`mensagem_id`),
  KEY `agendamento_denuncia_resolvido_por_id_6e409f4f_fk_auth_user` (`resolvido_por_id`),
  CONSTRAINT `agendamento_denuncia_agendamento_id_fe050d5e_fk_agendamen` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamento_agendamento` (`id`),
  CONSTRAINT `agendamento_denuncia_denunciado_id_83d2a9bd_fk_auth_user` FOREIGN KEY (`denunciado_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `agendamento_denuncia_denunciante_id_3b8c7146_fk_auth_user` FOREIGN KEY (`denunciante_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `agendamento_denuncia_mensagem_id_48c94911_fk_agendamen` FOREIGN KEY (`mensagem_id`) REFERENCES `agendamento_mensagem` (`id`),
  CONSTRAINT `agendamento_denuncia_resolvido_por_id_6e409f4f_fk_auth_user` FOREIGN KEY (`resolvido_por_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `agendamento_mensagem`
--

DROP TABLE IF EXISTS `agendamento_mensagem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamento_mensagem` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `texto` longtext NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `agendamento_id` bigint NOT NULL,
  `remetente_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `agendamento_mensagem_agendamento_id_b646760e_fk_agendamen` (`agendamento_id`),
  KEY `agendamento_mensagem_remetente_id_59667cc2_fk_auth_user_id` (`remetente_id`),
  CONSTRAINT `agendamento_mensagem_agendamento_id_b646760e_fk_agendamen` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamento_agendamento` (`id`),
  CONSTRAINT `agendamento_mensagem_remetente_id_59667cc2_fk_auth_user_id` FOREIGN KEY (`remetente_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `agendamento_pagamento`
--

DROP TABLE IF EXISTS `agendamento_pagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agendamento_pagamento` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `valor` decimal(8,2) NOT NULL,
  `metodo` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `codigo_pix` varchar(255) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `agendamento_id` bigint NOT NULL,
  `percentual_reembolso` decimal(5,2) DEFAULT NULL,
  `reembolsado_em` datetime(6) DEFAULT NULL,
  `status_reembolso` varchar(20) NOT NULL,
  `valor_reembolsado` decimal(8,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `agendamento_id` (`agendamento_id`),
  CONSTRAINT `agendamento_pagament_agendamento_id_9c25f246_fk_agendamen` FOREIGN KEY (`agendamento_id`) REFERENCES `agendamento_agendamento` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contas_cartaosalvo`
--

DROP TABLE IF EXISTS `contas_cartaosalvo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_cartaosalvo` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `apelido` varchar(50) NOT NULL,
  `bandeira` varchar(20) NOT NULL,
  `ultimos_digitos` varchar(4) NOT NULL,
  `validade` varchar(7) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `aluno_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contas_cartaosalvo_aluno_id_6ed5e1c5_fk_contas_perfilaluno_id` (`aluno_id`),
  CONSTRAINT `contas_cartaosalvo_aluno_id_6ed5e1c5_fk_contas_perfilaluno_id` FOREIGN KEY (`aluno_id`) REFERENCES `contas_perfilaluno` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contas_favorito`
--

DROP TABLE IF EXISTS `contas_favorito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_favorito` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `criado_em` datetime(6) NOT NULL,
  `aluno_id` bigint NOT NULL,
  `professor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `contas_favorito_aluno_id_professor_id_8cdd5ccd_uniq` (`aluno_id`,`professor_id`),
  KEY `contas_favorito_professor_id_919609ad_fk_contas_pe` (`professor_id`),
  CONSTRAINT `contas_favorito_aluno_id_f763fff9_fk_contas_perfilaluno_id` FOREIGN KEY (`aluno_id`) REFERENCES `contas_perfilaluno` (`id`),
  CONSTRAINT `contas_favorito_professor_id_919609ad_fk_contas_pe` FOREIGN KEY (`professor_id`) REFERENCES `contas_perfilprofessor` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contas_perfilaluno`
--

DROP TABLE IF EXISTS `contas_perfilaluno`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_perfilaluno` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `criado_em` datetime(6) NOT NULL,
  `user_id` int NOT NULL,
  `avatar` varchar(100) DEFAULT NULL,
  `sobre` longtext NOT NULL DEFAULT (_utf8mb4''),
  `materias_interesse` json NOT NULL DEFAULT (_utf8mb4'[]'),
  `nivel_academico` varchar(20) NOT NULL,
  `objetivo` varchar(30) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `contas_perfilaluno_user_id_8866e9d3_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contas_perfilprofessor`
--

DROP TABLE IF EXISTS `contas_perfilprofessor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_perfilprofessor` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `biografia` longtext NOT NULL,
  `preco_hora` decimal(8,2) NOT NULL,
  `avatar` varchar(100) DEFAULT NULL,
  `avaliacao_media` decimal(3,2) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `user_id` int NOT NULL,
  `curriculo` varchar(100) DEFAULT NULL,
  `motivo_rejeicao` longtext NOT NULL DEFAULT (_utf8mb4''),
  `status_verificacao` varchar(20) NOT NULL,
  `verificacao_detalhe` longtext NOT NULL DEFAULT (_utf8mb4''),
  `verificado_em` datetime(6) DEFAULT NULL,
  `chave_pix` varchar(150) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `documento_identidade` varchar(100) DEFAULT NULL,
  `metodologia_ensino` longtext NOT NULL DEFAULT (_utf8mb4''),
  `status_documento` varchar(20) NOT NULL,
  `video_apresentacao` varchar(100) DEFAULT NULL,
  `video_apresentacao_url` varchar(200) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `contas_perfilprofessor_user_id_98cf66b0_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `contas_saque`
--

DROP TABLE IF EXISTS `contas_saque`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contas_saque` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `valor` decimal(8,2) NOT NULL,
  `chave_pix_usada` varchar(150) NOT NULL,
  `criado_em` datetime(6) NOT NULL,
  `professor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `contas_saque_professor_id_469c14fe_fk_contas_perfilprofessor_id` (`professor_id`),
  CONSTRAINT `contas_saque_professor_id_469c14fe_fk_contas_perfilprofessor_id` FOREIGN KEY (`professor_id`) REFERENCES `contas_perfilprofessor` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `professores_disciplina`
--

DROP TABLE IF EXISTS `professores_disciplina`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professores_disciplina` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `descricao` longtext NOT NULL,
  `professor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  KEY `professores_discipli_professor_id_e030b3a0_fk_contas_pe` (`professor_id`),
  CONSTRAINT `professores_discipli_professor_id_e030b3a0_fk_contas_pe` FOREIGN KEY (`professor_id`) REFERENCES `contas_perfilprofessor` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `professores_disponibilidade`
--

DROP TABLE IF EXISTS `professores_disponibilidade`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `professores_disponibilidade` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `dia_semana` varchar(20) NOT NULL,
  `horario_inicio` time(6) NOT NULL,
  `horario_fim` time(6) NOT NULL,
  `status` varchar(20) NOT NULL,
  `disciplina_id` bigint NOT NULL,
  `professor_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `professores_disponibilid_professor_id_disciplina__329a2a8b_uniq` (`professor_id`,`disciplina_id`,`dia_semana`,`horario_inicio`),
  KEY `professores_disponib_disciplina_id_94450caa_fk_professor` (`disciplina_id`),
  KEY `professores_disponibilidade_professor_id_536cb60b` (`professor_id`),
  CONSTRAINT `professores_disponib_disciplina_id_94450caa_fk_professor` FOREIGN KEY (`disciplina_id`) REFERENCES `professores_disciplina` (`id`),
  CONSTRAINT `professores_disponib_professor_id_536cb60b_fk_contas_pe` FOREIGN KEY (`professor_id`) REFERENCES `contas_perfilprofessor` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed
