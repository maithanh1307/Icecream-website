CREATE DATABASE IF NOT EXISTS finalnodejs;
USE finalnodejs;

INSERT INTO `categories` VALUES (1,'Ice cream cone',NULL),(2,'Cream with topping',NULL),(3,'Cream jar',NULL),(4,'Ice cream',NULL);
INSERT INTO `products` VALUES (3,'Candy Cream','Cream with topping candy sweets',20000.00,0,0,10.00,2,'/image/1733300798017-1733228910637-kemli.jpg','2024-12-04 08:26:38'),(4,'Lemon Cream','Cream with lemon flavours',10000.00,0,0,4.00,1,'/image/1733300942981-kemcay.jpg','2024-12-04 08:29:02'),(5,'Rose Cream','Cream with strawberry flavour',20000.00,0,0,10.00,4,'/image/1733301022736-1733289435692-kemdau.jpg','2024-12-04 08:30:22'),(6,'Matcha ice cream','Ice cream with matcha flavour and adorable frog face',20000.00,0,0,4.00,1,'/image/1733301336144-kemech.jpg','2024-12-04 08:35:36'),(7,'Brownie Cream','Chocolate cream in jar',13000.00,0,0,2.00,3,'/image/1733301456066-socola.jpg','2024-12-04 08:37:36'),(8,'Mini sky cream','Cream with color blue coresponding sky',15000.00,0,0,7.00,2,'/image/1733301564319-vietquat.jpg','2024-12-04 08:39:24'),(9,'Vani ice cream','Cream with tiny cookies',30000.00,0,0,10.00,2,'/image/1733301978308-kembanh.jpg','2024-12-04 08:46:18'),(10,'Honey sweet cream','Cream with caramel sauces',25000.00,0,0,3.00,4,'/image/1733302167360-kemcaramen.jpg','2024-12-04 08:49:27'),(11,'Violet Cream','Cream with mulberry',18000.00,0,0,3.00,3,'/image/1733302332541-kemdautam.jpg','2024-12-04 08:52:12');

INSERT INTO `product_tags` VALUES (1,'Best seller'),(2,'New arrival'),(3,'Normal');
INSERT INTO `product_variants` VALUES (3,3,'Strawberry','Small',10,19997.00,'2024-12-04 08:26:38'),(4,4,'Banana','Medium',15,9997.00,'2024-12-04 08:29:03'),(5,5,'Strawberry','Large',12,20000.00,'2024-12-04 08:30:22'),(6,6,'Matcha','Medium',10,20000.00,'2024-12-04 08:35:36'),(7,7,'Chocolate','Small',5,13000.00,'2024-12-04 08:37:36'),(8,8,'Blueberry','Large',10,15000.00,'2024-12-04 08:39:24'),(9,9,'Vani','Medium',10,29996.00,'2024-12-04 08:46:18'),(10,10,'Caramel','Medium',5,25000.00,'2024-12-04 08:49:27'),(11,11,'Mulberry','Small',10,18000.00,'2024-12-04 08:52:12');
INSERT INTO `product_tag_map` VALUES (5,1),(8,1),(10,1),(6,2),(7,2),(11,2),(3,3),(4,3),(9,3);
