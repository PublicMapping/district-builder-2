import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { RegionConfigsModule } from "../region-configs/region-configs.module";
import { OrganizationsModule } from "../organizations/organizations.module";
import { ProjectTemplatesController } from "./controllers/project-templates.controller";
import { ProjectTemplatesService } from "./services/project-templates.service";
import { ProjectTemplate } from "./entities/project-template.entity";

@Module({
  imports: [TypeOrmModule.forFeature([ProjectTemplate]), RegionConfigsModule, OrganizationsModule],
  controllers: [ProjectTemplatesController],
  providers: [ProjectTemplatesService],
  exports: [ProjectTemplatesService]
})
export class ProjectTemplatesModule {}
