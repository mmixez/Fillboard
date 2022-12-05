-- MySQL Workbench Forward Engineering

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL,ALLOW_INVALID_DATES';

-- -----------------------------------------------------
-- Schema Fillboard
-- -----------------------------------------------------

-- -----------------------------------------------------
-- Schema Fillboard
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `Fillboard` DEFAULT CHARACTER SET utf8 ;
USE `Fillboard` ;

-- -----------------------------------------------------
-- Table `Fillboard`.`fillboard_user`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`fillboard_user` (
  `id_fillboard_user` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(45) NOT NULL,
  `email` VARCHAR(45) NOT NULL,
  `password` VARCHAR(200) NOT NULL,
  `birthday` VARCHAR(45) NULL,
  `gender` VARCHAR(45) NULL,
  `biography` VARCHAR(200) NULL,
  PRIMARY KEY (`id_fillboard_user`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`country`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`country` (
  `country_code` VARCHAR(3) NOT NULL,
  `name` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`country_code`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`location`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`location` (
  `idlocation` INT NOT NULL AUTO_INCREMENT,
  `country_country_code` VARCHAR(3) NOT NULL,
  `city_name` VARCHAR(45) NOT NULL,
  `zip` INT NOT NULL,
  `street_address` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`idlocation`, `country_country_code`),
  INDEX `fk_location_country1_idx` (`country_country_code` ASC),
  CONSTRAINT `fk_location_country1`
    FOREIGN KEY (`country_country_code`)
    REFERENCES `Fillboard`.`country` (`country_code`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`category` (
  `id_category` INT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(45) NOT NULL,
  `description` VARCHAR(45) NULL,
  PRIMARY KEY (`id_category`))
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`sub_category`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`sub_category` (
  `idsub_category` INT NOT NULL AUTO_INCREMENT,
  `sub_category_name` VARCHAR(45) NOT NULL,
  `sub_category_desc` VARCHAR(45) NULL,
  `category_id_category` INT NOT NULL,
  PRIMARY KEY (`idsub_category`, `category_id_category`),
  INDEX `fk_sub_category_category1_idx` (`category_id_category` ASC),
  CONSTRAINT `fk_sub_category_category1`
    FOREIGN KEY (`category_id_category`)
    REFERENCES `Fillboard`.`category` (`id_category`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`event`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`event` (
  `id_event` INT NOT NULL AUTO_INCREMENT,
  `event_name` VARCHAR(45) NOT NULL,
  `description` VARCHAR(200) NULL,
  `begin_date` VARCHAR(45) NOT NULL,
  `end_date` VARCHAR(45) NOT NULL,
  `location_idlocation` INT NOT NULL,
  `sub_category_idsub_category` INT NOT NULL,
  `min_participants` INT NOT NULL,
  `max_participants` INT NOT NULL,
  `event_picture_path` VARCHAR(200) NULL,
  PRIMARY KEY (`id_event`, `location_idlocation`, `sub_category_idsub_category`),
  INDEX `fk_event_location1_idx` (`location_idlocation` ASC),
  INDEX `fk_event_sub_category1_idx` (`sub_category_idsub_category` ASC),
  CONSTRAINT `fk_event_location1`
    FOREIGN KEY (`location_idlocation`)
    REFERENCES `Fillboard`.`location` (`idlocation`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_event_sub_category1`
    FOREIGN KEY (`sub_category_idsub_category`)
    REFERENCES `Fillboard`.`sub_category` (`idsub_category`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`participates`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`participates` (
  `user_id` INT NOT NULL,
  `event_id` INT NOT NULL,
  PRIMARY KEY (`user_id`, `event_id`),
  INDEX `fk_fillboard_user_has_event_event1_idx` (`event_id` ASC),
  INDEX `fk_fillboard_user_has_event_fillboard_user_idx` (`user_id` ASC),
  CONSTRAINT `fk_fillboard_user_has_event_fillboard_user`
    FOREIGN KEY (`user_id`)
    REFERENCES `Fillboard`.`fillboard_user` (`id_fillboard_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fillboard_user_has_event_event1`
    FOREIGN KEY (`event_id`)
    REFERENCES `Fillboard`.`event` (`id_event`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`posts`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`posts` (
  `idposts` INT NOT NULL AUTO_INCREMENT,
  `heading` VARCHAR(45) NOT NULL,
  `post_text` VARCHAR(200) NOT NULL,
  `event_id` INT NOT NULL,
  `user_id_posts` INT NOT NULL,
  `post_picture_path` VARCHAR(200) NULL,
  PRIMARY KEY (`idposts`, `event_id`, `user_id_posts`),
  INDEX `fk_posts_event1_idx` (`event_id` ASC),
  INDEX `fk_posts_fillboard_user1_idx` (`user_id_posts` ASC),
  CONSTRAINT `fk_posts_event1`
    FOREIGN KEY (`event_id`)
    REFERENCES `Fillboard`.`event` (`id_event`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_posts_fillboard_user1`
    FOREIGN KEY (`user_id_posts`)
    REFERENCES `Fillboard`.`fillboard_user` (`id_fillboard_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`friends`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`friends` (
  `fillboard_user_id_1` INT NOT NULL,
  `fillboard_user_id_2` INT NOT NULL,
  PRIMARY KEY (`fillboard_user_id_1`, `fillboard_user_id_2`),
  INDEX `fk_fillboard_user_has_fillboard_user_fillboard_user2_idx` (`fillboard_user_id_2` ASC),
  INDEX `fk_fillboard_user_has_fillboard_user_fillboard_user1_idx` (`fillboard_user_id_1` ASC),
  CONSTRAINT `fk_fillboard_user_has_fillboard_user_fillboard_user1`
    FOREIGN KEY (`fillboard_user_id_1`)
    REFERENCES `Fillboard`.`fillboard_user` (`id_fillboard_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_fillboard_user_has_fillboard_user_fillboard_user2`
    FOREIGN KEY (`fillboard_user_id_2`)
    REFERENCES `Fillboard`.`fillboard_user` (`id_fillboard_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


-- -----------------------------------------------------
-- Table `Fillboard`.`comments`
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `Fillboard`.`comments` (
  `idcomments` INT NOT NULL AUTO_INCREMENT,
  `comments_text` VARCHAR(200) NULL,
  `idposts` INT NOT NULL,
  `user_id_comments` INT NOT NULL,
  PRIMARY KEY (`idcomments`, `idposts`, `user_id_comments`),
  INDEX `fk_comments_posts1_idx` (`idposts` ASC),
  INDEX `fk_comments_fillboard_user1_idx` (`user_id_comments` ASC),
  CONSTRAINT `fk_comments_posts1`
    FOREIGN KEY (`idposts`)
    REFERENCES `Fillboard`.`posts` (`idposts`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION,
  CONSTRAINT `fk_comments_fillboard_user1`
    FOREIGN KEY (`user_id_comments`)
    REFERENCES `Fillboard`.`fillboard_user` (`id_fillboard_user`)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION)
ENGINE = InnoDB;


SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;

-- -----------------------------------------------------
-- Data for table `Fillboard`.`fillboard_user`
-- -----------------------------------------------------
START TRANSACTION;
USE `Fillboard`;
INSERT INTO `Fillboard`.`fillboard_user` (`id_fillboard_user`, `username`, `email`, `password`, `birthday`, `gender`, `biography`) VALUES (1, 'Moritz', 'moritz@gmail.com', '$2b$10$y4JbN7IPIg/xM4bifWCJGebEeLyu9hUkG6b9IKWJzmWLZ8pi8FlD6', '26.12.1999', 'Male', 'I like turtles');
INSERT INTO `Fillboard`.`fillboard_user` (`id_fillboard_user`, `username`, `email`, `password`, `birthday`, `gender`, `biography`) VALUES (2, 'Ian', 'ian@gmail.com', '$2b$10$gIivPG6Q95yBZnQIfFolHeP7RQwiOW8V4DK3BTQck7PfDSr00Rn3O', '07.24.2001', 'Male', 'I like ice cream');
INSERT INTO Fillboard.fillboard_user (id_fillboard_user, username, email, password, birthday, gender, biography) VALUES (4, 'Syed', 'Syed@gmail.com', '$2b$10$8IW9EjaopYWfDyC8.4SG2O2Mu5cBMwWopId0Zmw4piRwSPwb2R/.m', '06/21/1998', 'MALE', 'Hey I am Syed. I am a CS major at SJSU and I am about to graduate!!');
INSERT INTO Fillboard.fillboard_user (id_fillboard_user, username, email, password, birthday, gender, biography) VALUES (3, 'Kwangoh', 'kwangoh@gmail.com', '$2b$10$8IW9EjaopYWfDyC8.4SG2O2Mu5cBMwWopId0Zmw4piRwSPwb2R/.m', '06/07/1998', 'MALE', "It ain't over 'til it's over");

COMMIT;


-- -----------------------------------------------------
-- Data for table `Fillboard`.`country`
-- -----------------------------------------------------
START TRANSACTION;
USE `Fillboard`;
INSERT INTO `Fillboard`.`country` (`country_code`, `name`) VALUES ('USA', 'United States of America');
INSERT INTO `Fillboard`.`country` (`country_code`, `name`) VALUES ('MEX', 'Mexico');
INSERT INTO `Fillboard`.`country` (`country_code`, `name`) VALUES ('DEU', 'Germany');
INSERT INTO `Fillboard`.`country` (`country_code`, `name`) VALUES ('CAN', 'Canada');
INSERT INTO `Fillboard`.`country` (`country_code`, `name`) VALUES ('KOR', 'South Korea');

COMMIT;


-- -----------------------------------------------------
-- Data for table `Fillboard`.`location`
-- -----------------------------------------------------
START TRANSACTION;
USE `Fillboard`;
INSERT INTO `Fillboard`.`location` (`idlocation`, `country_country_code`, `city_name`, `zip`, `street_address`) VALUES (1, 'USA', 'San Jose', 95192, '1 Washington Sq');
INSERT INTO `Fillboard`.`location` (`idlocation`, `country_country_code`, `city_name`, `zip`, `street_address`) VALUES (2, 'DEU', 'Bayern', 81547, 'Säbener Straße 51');
INSERT INTO location (`idlocation`, `country_country_code`, `city_name`, `zip`, `street_address`) VALUES (3, 'USA', 'Anaheim', 77777, 'Happiest Place on Earth');
INSERT INTO location (`idlocation`, `country_country_code`, `city_name`, `zip`, `street_address`) VALUES (4, 'USA', 'San Jose', 77777, 'Bunker Hill');
INSERT INTO location (idlocation, country_country_code, city_name, zip, street_address) VALUES (5, 'USA', 'San Jose', 95192, 'Main SJSU fountains in the courtyard.');


COMMIT;


-- -----------------------------------------------------
-- Data for table `Fillboard`.`category`
-- -----------------------------------------------------
START TRANSACTION;
USE `Fillboard`;
INSERT INTO `Fillboard`.`category` (`id_category`, `category_name`, `description`) VALUES (1, 'Outdoor Sports', NULL);
INSERT INTO `Fillboard`.`category` (`id_category`, `category_name`, `description`) VALUES (2, 'Indoor Sports', NULL);
INSERT INTO `Fillboard`.`category` (`id_category`, `category_name`, `description`) VALUES (3, 'Evening Activities', NULL);
INSERT INTO `Fillboard`.`category` (`id_category`, `category_name`, `description`) VALUES (4, 'Indoor Activities', NULL);
INSERT INTO `Fillboard`.`category` (`id_category`, `category_name`, `description`) VALUES (5, 'Outdoor Activities', NULL);



COMMIT;


-- -----------------------------------------------------
-- Data for table `Fillboard`.`sub_category`
-- -----------------------------------------------------
START TRANSACTION;
USE `Fillboard`;
INSERT INTO `Fillboard`.`sub_category` (`idsub_category`, `sub_category_name`, `sub_category_desc`, `category_id_category`) VALUES (1, 'Jogging', NULL, 1);
INSERT INTO `Fillboard`.`sub_category` (`idsub_category`, `sub_category_name`, `sub_category_desc`, `category_id_category`) VALUES (2, 'Cycling', NULL, 1);
INSERT INTO `Fillboard`.`sub_category` (`idsub_category`, `sub_category_name`, `sub_category_desc`, `category_id_category`) VALUES (3, 'Yoga', NULL, 2);
INSERT INTO `Fillboard`.`sub_category` (`idsub_category`, `sub_category_name`, `sub_category_desc`, `category_id_category`) VALUES (4, 'Bar Hopping', NULL, 3);
INSERT INTO `Fillboard`.`sub_category` (`idsub_category`, `sub_category_name`, `sub_category_desc`, `category_id_category`) VALUES (5, 'Ice Skating', NULL, 2);
INSERT INTO `Fillboard`.`sub_category` (`idsub_category`, `sub_category_name`, `sub_category_desc`, `category_id_category`) VALUES (6, 'Gaming', NULL, 4);
INSERT INTO `Fillboard`.`sub_category` (`idsub_category`, `sub_category_name`, `sub_category_desc`, `category_id_category`) VALUES (7, 'Project Presentation', NULL, 4);
INSERT INTO `Fillboard`.`sub_category` (`idsub_category`, `sub_category_name`, `sub_category_desc`, `category_id_category`) VALUES (8, 'Outdoor fun', NULL, 5);


COMMIT;


-- -----------------------------------------------------
-- Data for table `Fillboard`.`event`
-- -----------------------------------------------------
START TRANSACTION;
USE `Fillboard`;
INSERT INTO `Fillboard`.`event` (`id_event`, `event_name`, `description`, `begin_date`, `end_date`, `location_idlocation`, `sub_category_idsub_category`, `min_participants`, `max_participants`, `event_picture_path`) VALUES (1, 'Jogging SJSU', 'Meet with us for Jogging on Sunday. SJSU ID is required', '2022-10-10T10:00', '2022-10-10T12:00', 1, 1, 2, 10, NULL);
INSERT INTO `Fillboard`.`event` (`id_event`, `event_name`, `description`, `begin_date`, `end_date`, `location_idlocation`, `sub_category_idsub_category`, `min_participants`, `max_participants`, `event_picture_path`) VALUES (2, 'SJSU Party', 'Dresscode is black', '2022-12-06T16:48', '2022-12-14T16:48', 1, 1, 4, 16, 'Moritz_2');
INSERT INTO `Fillboard`.`event` (`id_event`, `event_name`, `description`, `begin_date`, `end_date`, `location_idlocation`, `sub_category_idsub_category`, `min_participants`, `max_participants`, `event_picture_path`) VALUES (3, 'CS160 Final Submission', 'Final Project Presentation', '2022-12-04T15:00', '2022-12-04T16:00', 1, 7, 4, 4, 'Moritz_3');
INSERT INTO Fillboard.event (id_event, event_name, description, begin_date, end_date, location_idlocation, sub_category_idsub_category, min_participants, max_participants, event_picture_path) VALUES (4, 'Rock Climbing!', 'Meet at the SRAC to get into a friendly rock climbing competition.', '2023-01-04T15:00', '2023-01-04T16:00', 1, 1, 2, 15, NULL);
INSERT INTO Fillboard.event (id_event, event_name, description, begin_date, end_date, location_idlocation, sub_category_idsub_category, min_participants, max_participants, event_picture_path) VALUES (5, 'Gaming in Bayern!', 'Bring chips and drinks :-)', '2022-12-20T15:00', '2022-12-20T24:00', 2, 6, 5, 10, 'Ian_5');
INSERT INTO event VALUES (6, 'Disneyland Meet Up!', 'Meet with us for Disneyland fun! We plan to get turkey legs haha!', '12-18-2022T12:00', '12-18-2022T18:00', 4, 8, 2, 10, NULL);
INSERT INTO event VALUES (7, 'Wait for the stars!', 'Lets watch the night sky emerge after the light goes out!!', '12-20-2022T23:00', '12-21-2022T10:00', 3, 8, 2, 10, "Ian_7");
INSERT INTO Fillboard.event (id_event, event_name, description, begin_date, end_date, location_idlocation, sub_category_idsub_category, min_participants, max_participants, event_picture_path) VALUES (8, 'SJSU Alumni Half-Marathon', 'TIME to be back to SCHOOL!', '2023-01-02T09:00', '2023-01-02T12:00', 1, 1, 50, 99, 'Kwangoh_8');
INSERT INTO Fillboard.event (id_event, event_name, description, begin_date, end_date, location_idlocation, sub_category_idsub_category, min_participants, max_participants, event_picture_path) VALUES (9, 'Archery Showcase', 'Archery students will be showcasing their skills. Meet at the fountain.', '2022-09-20T10:00', '2022-09-20T12:00', 5, 8, 1, 100, 'Syed_9');
COMMIT;

START TRANSACTION;
USE `Fillboard`;
INSERT INTO posts (heading, post_text, event_id, user_id_posts, post_picture_path)  VALUES ("Who is coming tonight ?", "I'm excited to see your dance skills", 1,1, NULL);
INSERT INTO posts  VALUES (2,"Wish us all luck", "Tomorrow is presentation I bet we can do it", 3,2, "Ian_2");
INSERT INTO posts VALUES (3, "Running was good", "Very exhausting but fun ", 3,4,"Syed_3");
INSERT INTO posts VALUES (4, "Tomorrow will be hard....", "When you are having CS160 & CS157 presentations in a row", 3,3, "Kwangoh_4");



COMMIT;



