import AppDataSource from "../app-data-source";
import { ContactUs } from "../entities/ContactUs";

export class ContactUsService {
  static contactUsRepo = AppDataSource.getRepository(ContactUs);

  static async createContact(
    name: string,
    email: string,
    title: string,
    description: string
  ) {
    const contact = this.contactUsRepo.create({
      name,
      email,
      title,
      description,
    });
    await this.contactUsRepo.save(contact);
    return contact;
  }
}
